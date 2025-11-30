const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'travelmateai',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const createPublicTripRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreatePublicTrip', inputVars);
}
createPublicTripRef.operationName = 'CreatePublicTrip';
exports.createPublicTripRef = createPublicTripRef;

exports.createPublicTrip = function createPublicTrip(dcOrVars, vars) {
  return executeMutation(createPublicTripRef(dcOrVars, vars));
};

const getPublicTripsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetPublicTrips');
}
getPublicTripsRef.operationName = 'GetPublicTrips';
exports.getPublicTripsRef = getPublicTripsRef;

exports.getPublicTrips = function getPublicTrips(dc) {
  return executeQuery(getPublicTripsRef(dc));
};

const createActivityForDestinationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateActivityForDestination', inputVars);
}
createActivityForDestinationRef.operationName = 'CreateActivityForDestination';
exports.createActivityForDestinationRef = createActivityForDestinationRef;

exports.createActivityForDestination = function createActivityForDestination(dcOrVars, vars) {
  return executeMutation(createActivityForDestinationRef(dcOrVars, vars));
};

const getActivitiesForDestinationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetActivitiesForDestination', inputVars);
}
getActivitiesForDestinationRef.operationName = 'GetActivitiesForDestination';
exports.getActivitiesForDestinationRef = getActivitiesForDestinationRef;

exports.getActivitiesForDestination = function getActivitiesForDestination(dcOrVars, vars) {
  return executeQuery(getActivitiesForDestinationRef(dcOrVars, vars));
};
