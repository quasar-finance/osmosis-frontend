import { AppCurrency, FiatCurrency } from "@keplr-wallet/types";
import { CoinPretty, Dec, PricePretty } from "@keplr-wallet/unit";
import classNames from "classnames";
import { observer } from "mobx-react-lite";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, {
  FunctionComponent,
  ReactNode,
  useEffect,
  useState,
} from "react";
import { useTranslation } from "react-multi-lang";

import { Button } from "~/components/buttons";
import { ChartButton } from "~/components/buttons";
import { PriceChartHeader } from "~/components/chart/token-pair-historical";
import { IncreaseConcentratedLiquidityModal } from "~/modals/increase-concentrated-liquidity";
import { RemoveConcentratedLiquidityModal } from "~/modals/remove-concentrated-liquidity";
import { useStore } from "~/stores";
import { ObservableHistoricalAndLiquidityData } from "~/stores/derived-data/concentrated-liquidity/historical-and-liquidity-data";
import { formatPretty } from "~/utils/formatter";

const ConcentratedLiquidityDepthChart = dynamic(
  () => import("~/components/chart/concentrated-liquidity-depth"),
  { ssr: false }
);
const TokenPairHistoricalChart = dynamic(
  () => import("~/components/chart/token-pair-historical"),
  { ssr: false }
);

export const MyPositionCardExpandedSection: FunctionComponent<{
  chartConfig: ObservableHistoricalAndLiquidityData;
  positionIds: string[];
  baseAmount: Dec;
  quoteAmount: Dec;
  lowerPrice: Dec;
  upperPrice: Dec;
  poolId: string;
  passive: boolean;
}> = observer(
  ({
    chartConfig,
    baseAmount,
    quoteAmount,
    lowerPrice,
    upperPrice,
    passive,
    poolId,
    positionIds,
  }) => {
    const {
      historicalChartData,
      historicalRange,
      xRange,
      yRange,
      setHoverPrice,
      lastChartData,
      depthChartData,
      setZoom,
      zoomIn,
      zoomOut,
      range,
      priceDecimal,
      setHistoricalRange,
      baseDenom,
      quoteDenom,
      hoverPrice,
      setRange,
      baseCurrency,
      quoteCurrency,
    } = chartConfig;

    const { priceStore } = useStore();

    const t = useTranslation();

    const [showIncreaseLiquidityModal, updateShowIncreaseLiqModal] =
      useState<boolean>(false);

    const [showRemoveLiquidityModal, updateShowRemoveLiqModal] =
      useState<boolean>(false);

    const fiatPerBase =
      baseCurrency &&
      priceStore.calculatePrice(
        new CoinPretty(
          baseCurrency,
          baseAmount.mul(new Dec(10 ** baseCurrency.coinDecimals))
        )
      );

    const fiatPerQuote =
      quoteCurrency &&
      priceStore.calculatePrice(
        new CoinPretty(
          quoteCurrency,
          quoteAmount.mul(new Dec(10 ** quoteCurrency.coinDecimals))
        )
      );

    const fiatCurrency =
      priceStore.supportedVsCurrencies[priceStore.defaultVsCurrency];

    useEffect(() => {
      setRange([lowerPrice, upperPrice]);
    }, [lowerPrice.toString(), upperPrice.toString()]);

    return (
      <div className="flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
        {showIncreaseLiquidityModal && (
          <IncreaseConcentratedLiquidityModal
            poolId={poolId}
            isOpen={showIncreaseLiquidityModal}
            positionIds={positionIds}
            lowerPrice={lowerPrice}
            upperPrice={upperPrice}
            baseAmount={baseAmount}
            quoteAmount={quoteAmount}
            passive={passive}
            onRequestClose={() => updateShowIncreaseLiqModal(false)}
          />
        )}
        {showRemoveLiquidityModal && (
          <RemoveConcentratedLiquidityModal
            poolId={poolId}
            isOpen={showRemoveLiquidityModal}
            positionIds={positionIds}
            lowerPrice={lowerPrice}
            upperPrice={upperPrice}
            baseAmount={baseAmount}
            quoteAmount={quoteAmount}
            passive={passive}
            onRequestClose={() => updateShowRemoveLiqModal(false)}
          />
        )}
        <div className="flex flex-row gap-1">
          <div className="flex-shrink-1 flex h-[20.1875rem] w-0 flex-1 flex-col gap-[20px] rounded-l-2xl bg-osmoverse-700 py-7 pl-6">
            <PriceChartHeader
              historicalRange={historicalRange}
              setHistoricalRange={setHistoricalRange}
              baseDenom={baseDenom}
              quoteDenom={quoteDenom}
              hoverPrice={hoverPrice}
              decimal={priceDecimal}
            />
            <TokenPairHistoricalChart
              data={historicalChartData}
              annotations={
                passive
                  ? [
                      new Dec((yRange[0] || 0) * 1.05),
                      new Dec((yRange[1] || 0) * 0.95),
                    ]
                  : range || []
              }
              domain={yRange}
              onPointerHover={setHoverPrice}
              onPointerOut={
                lastChartData
                  ? () => setHoverPrice(lastChartData.close)
                  : undefined
              }
            />
          </div>
          <div className="flex-shrink-1 flex h-[20.1875rem] w-0 flex-1 flex-row rounded-r-2xl bg-osmoverse-700">
            <div className="mt-[84px] flex flex-1 flex-col">
              <ConcentratedLiquidityDepthChart
                yRange={yRange}
                xRange={xRange}
                data={depthChartData}
                annotationDatum={{
                  price: lastChartData?.close || 0,
                  depth: xRange[1],
                }}
                rangeAnnotation={[
                  {
                    price: Number(lowerPrice.toString()),
                    depth: xRange[1],
                  },
                  {
                    price: Number(upperPrice.toString()),
                    depth: xRange[1],
                  },
                ]}
                offset={{ top: 0, right: 36, bottom: 24 + 28, left: 0 }}
                horizontal
                fullRange={passive}
              />
            </div>
            <div className="mb-8 flex flex-col pr-8">
              <div className="mt-7 mr-6 flex h-6 flex-row gap-1">
                <ChartButton
                  alt="refresh"
                  src="/icons/refresh-ccw.svg"
                  selected={false}
                  onClick={() => setZoom(1)}
                />
                <ChartButton
                  alt="zoom in"
                  src="/icons/zoom-in.svg"
                  selected={false}
                  onClick={zoomIn}
                />
                <ChartButton
                  alt="zoom out"
                  src="/icons/zoom-out.svg"
                  selected={false}
                  onClick={zoomOut}
                />
              </div>
              <div className="flex h-full flex-col justify-between py-4">
                <PriceBox
                  currentValue={
                    passive ? "0" : upperPrice.toString(priceDecimal)
                  }
                  label={t("clPositions.maxPrice")}
                  infinity={passive}
                />
                <PriceBox
                  currentValue={
                    passive ? "0" : lowerPrice.toString(priceDecimal)
                  }
                  label={t("clPositions.minPrice")}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-row">
          <div className="flex w-full flex-col gap-4">
            <div className="flex flex-row justify-between">
              <AssetPairAmountDetail
                fiatPerBase={fiatPerBase}
                fiatPerQuote={fiatPerQuote}
                fiatCurrency={fiatCurrency}
                className="w-0 flex-shrink flex-grow"
                title={t("clPositions.currentAssets")}
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                baseAmount={baseAmount}
                quoteAmount={quoteAmount}
                baseDenom={baseDenom}
                quoteDenom={quoteDenom}
              />
              <AssetPairAmountDetail
                fiatPerBase={fiatPerBase}
                fiatPerQuote={fiatPerQuote}
                fiatCurrency={fiatCurrency}
                className="w-0 flex-shrink flex-grow"
                title={t("clPositions.totalFeesEarned")}
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                baseDenom={baseDenom}
                quoteDenom={quoteDenom}
              />
            </div>
            <div className="flex flex-row justify-between">
              <AssetPairAmountDetail
                fiatPerBase={fiatPerBase}
                fiatPerQuote={fiatPerQuote}
                fiatCurrency={fiatCurrency}
                className="w-0 flex-shrink flex-grow"
                title={t("clPositions.principleAssets")}
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                baseDenom={baseDenom}
                quoteDenom={quoteDenom}
              />
              <AssetPairAmountDetail
                fiatPerBase={fiatPerBase}
                fiatPerQuote={fiatPerQuote}
                fiatCurrency={fiatCurrency}
                className="w-0 flex-shrink flex-grow"
                title={t("clPositions.unclaimedFees")}
                baseCurrency={baseCurrency}
                quoteCurrency={quoteCurrency}
                baseDenom={baseDenom}
                quoteDenom={quoteDenom}
              />
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-row justify-end gap-5">
          <PositionButton onClick={() => null}>
            {t("clPositions.collectRewards")}
          </PositionButton>
          <PositionButton onClick={() => updateShowRemoveLiqModal(true)}>
            {t("clPositions.removeLiquidity")}
          </PositionButton>
          <PositionButton onClick={() => updateShowIncreaseLiqModal(true)}>
            {t("clPositions.increaseLiquidity")}
          </PositionButton>
        </div>
      </div>
    );
  }
);

function PositionButton(props: { children: ReactNode; onClick: () => void }) {
  return (
    <Button
      mode="unstyled"
      size="sm"
      className="text-white w-fit whitespace-nowrap rounded-[10px] border-2 border-wosmongton-400 bg-transparent py-4 px-5 text-subtitle1 font-subtitle1 hover:border-wosmongton-300 disabled:border-osmoverse-600 disabled:text-osmoverse-400"
      onClick={props.onClick}
    >
      {props.children}
    </Button>
  );
}

const AssetPairAmountDetail: FunctionComponent<{
  className?: string;
  title: string;
  baseCurrency?: AppCurrency;
  quoteCurrency?: AppCurrency;
  baseAmount?: Dec;
  baseDenom?: string;
  quoteAmount?: Dec;
  quoteDenom?: string;
  fiatPerBase?: PricePretty;
  fiatPerQuote?: PricePretty;
  fiatCurrency?: FiatCurrency;
}> = observer(
  ({
    className,
    title,
    fiatCurrency,
    baseCurrency,
    quoteCurrency,
    baseAmount,
    quoteAmount,
    fiatPerBase,
    fiatPerQuote,
  }) => {
    const totalFiat =
      fiatCurrency &&
      fiatPerBase &&
      fiatPerQuote &&
      new PricePretty(fiatCurrency, fiatPerBase.add(fiatPerQuote));

    if (!baseAmount || !quoteAmount) return null;

    return (
      <div
        className={classNames(
          "flex flex-col gap-2 text-osmoverse-400",
          className
        )}
      >
        <div className="text-subtitle1">{title}</div>
        <div className="flex flex-row items-center gap-5">
          {baseCurrency && (
            <div className="flex flex-row items-center gap-2">
              {baseCurrency.coinImageUrl && (
                <Image
                  alt="base currency"
                  src={baseCurrency.coinImageUrl}
                  height={24}
                  width={24}
                />
              )}
              <span>{baseAmount.toString(baseCurrency.coinDecimals)}</span>
              <span>{baseCurrency.coinDenom}</span>
            </div>
          )}
          {quoteCurrency && (
            <div className="flex flex-row items-center gap-2">
              {quoteCurrency.coinImageUrl && (
                <Image
                  alt="quote currency"
                  src={quoteCurrency.coinImageUrl}
                  height={24}
                  width={24}
                />
              )}
              <span>{quoteAmount.toString(quoteCurrency.coinDecimals)}</span>
              <span>{quoteCurrency.coinDenom}</span>
              <span>({totalFiat ? formatPretty(totalFiat) : "$0"})</span>
            </div>
          )}
        </div>
      </div>
    );
  }
);

function PriceBox(props: {
  label: string;
  currentValue: string;
  infinity?: boolean;
}) {
  return (
    <div className="flex w-full max-w-[9.75rem] flex-col gap-1">
      <span className="pt-2 text-caption text-osmoverse-400">
        {props.label}
      </span>
      {props.infinity ? (
        <div className="flex h-[41px] flex-row items-center">
          <Image
            alt="infinity"
            src="/icons/infinity.svg"
            width={16}
            height={16}
          />
        </div>
      ) : (
        <h6 className="overflow-hidden text-ellipsis border-0 bg-transparent text-subtitle1 leading-tight">
          {props.currentValue}
        </h6>
      )}
    </div>
  );
}