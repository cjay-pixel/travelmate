import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'travelmateai',
  location: 'us-east4'
};

export const createPublicTripRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePublicTrip', inputVars);
}
createPublicTripRef.operationName = 'CreatePublicTrip';

export function createPublicTrip(dcOrVars, vars) {
  return executeMutation(createPublicTripRef(dcOrVars, vars));
}

export const getPublicTripsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicTrips');
}
getPublicTripsRef.operationName = 'GetPublicTrips';

export function getPublicTrips(dc) {
  return executeQuery(getPublicTripsRef(dc));
}

export const createActivityForDestinationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateActivityForDestination', inputVars);
}
createActivityForDestinationRef.operationName = 'CreateActivityForDestination';

export function createActivityForDestination(dcOrVars, vars) {
  return executeMutation(createActivityForDestinationRef(dcOrVars, vars));
}

export const getActivitiesForDestinationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetActivitiesForDestination', inputVars);
}
getActivitiesForDestinationRef.operationName = 'GetActivitiesForDestination';

export function getActivitiesForDestination(dcOrVars, vars) {
  return executeQuery(getActivitiesForDestinationRef(dcOrVars, vars));
}

