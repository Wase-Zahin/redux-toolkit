import type { CreateSelectorFunction, Selector, createSelector } from 'reselect'
import { createDraftSafeSelector } from '../createDraftSafeSelector'
import type { EntityState, EntitySelectors, EntityId } from './models'

type AnyFunction = (...args: any) => any
type AnyCreateSelectorFunction = CreateSelectorFunction<
  <F extends AnyFunction>(f: F) => F,
  <F extends AnyFunction>(f: F) => F
>

export interface GetSelectorsOptions {
  // TODO Review if this causes issues or if we can go back to using `CreateSelectorFunction`
  createSelector?: AnyCreateSelectorFunction
}

export function createSelectorsFactory<T, Id extends EntityId>() {
  function getSelectors(
    selectState?: undefined,
    options?: GetSelectorsOptions
  ): EntitySelectors<T, EntityState<T, Id>, Id>
  function getSelectors<V>(
    selectState: (state: V) => EntityState<T, Id>,
    options?: GetSelectorsOptions
  ): EntitySelectors<T, V, Id>
  function getSelectors<V>(
    selectState?: (state: V) => EntityState<T, Id>,
    options: GetSelectorsOptions = {}
  ): EntitySelectors<T, any, Id> {
    let { createSelector } = options
    createSelector ??= createDraftSafeSelector

    const selectIds = (state: EntityState<T, Id>) => state.ids

    const selectEntities = (state: EntityState<T, Id>) => state.entities

    const selectAll = createSelector(
      selectIds,
      selectEntities,
      (ids, entities): T[] => ids.map((id) => entities[id]!)
    )

    const selectId = (_: unknown, id: Id) => id

    const selectById = (entities: Record<Id, T>, id: Id) => entities[id]

    const selectTotal = createSelector(selectIds, (ids) => ids.length)

    if (!selectState) {
      return {
        selectIds,
        selectEntities,
        selectAll,
        selectTotal,
        selectById: createSelector(selectEntities, selectId, selectById),
      }
    }

    const selectGlobalizedEntities = createSelector(
      selectState as Selector<V, EntityState<T, Id>>,
      selectEntities
    )

    return {
      selectIds: createSelector(selectState, selectIds),
      selectEntities: selectGlobalizedEntities,
      selectAll: createSelector(selectState, selectAll),
      selectTotal: createSelector(selectState, selectTotal),
      selectById: createSelector(
        selectGlobalizedEntities,
        selectId,
        selectById
      ),
    }
  }

  return { getSelectors }
}
