import { observer } from "mobx-react-lite";
import React, { FunctionComponent, useState } from "react";

import { ShowMoreButton } from "~/components/buttons/show-more";
import { MyPositionCard } from "~/components/cards";
import { useStore } from "~/stores";

const INITIAL_POSITION_CNT = 3;

/** List of position cards for a user. Optionally show positions only for a give pool ID via `forPoolId` prop. */
export const MyPositionsSection: FunctionComponent<{ forPoolId?: string }> =
  observer(({ forPoolId }) => {
    const { accountStore, chainStore, queriesStore } = useStore();
    const { chainId } = chainStore.osmosis;
    const account = accountStore.getAccount(chainId);
    const osmosisQueries = queriesStore.get(chainId).osmosis!;
    const [viewMore, setViewMore] = useState(false);

    const positions = osmosisQueries.queryAccountsPositions
      .get(account.bech32Address)
      .positions.filter((position) => {
        if (Boolean(forPoolId) && position.poolId !== forPoolId) {
          return false;
        }
        return true;
      });

    const visiblePositions = positions.slice(
      0,
      viewMore ? undefined : INITIAL_POSITION_CNT
    );

    return (
      <div className="flex flex-col gap-3">
        {visiblePositions.map((position) => (
          <MyPositionCard key={position.id} position={position} />
        ))}
        {visiblePositions.length > 0 &&
          visiblePositions.length > INITIAL_POSITION_CNT && (
            <ShowMoreButton
              className="mx-auto"
              isOn={viewMore}
              onToggle={() => setViewMore((v) => !v)}
            />
          )}
      </div>
    );
  });