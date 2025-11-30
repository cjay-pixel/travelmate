import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Activity_Key {
  id: UUIDString;
  __typename?: 'Activity_Key';
}

export interface CreateActivityForDestinationData {
  activity_insert: Activity_Key;
}

export interface CreateActivityForDestinationVariables {
  destinationId: UUIDString;
  name: string;
  activityDate: DateString;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
}

export interface CreatePublicTripData {
  trip_insert: Trip_Key;
}

export interface CreatePublicTripVariables {
  userId: UUIDString;
  name: string;
  startDate: DateString;
  endDate: DateString;
  description?: string | null;
}

export interface Destination_Key {
  id: UUIDString;
  __typename?: 'Destination_Key';
}

export interface GetActivitiesForDestinationData {
  activities: ({
    id: UUIDString;
    name: string;
    activityDate: DateString;
    startTime?: string | null;
    endTime?: string | null;
    location?: string | null;
    description?: string | null;
  } & Activity_Key)[];
}

export interface GetActivitiesForDestinationVariables {
  destinationId: UUIDString;
}

export interface GetPublicTripsData {
  trips: ({
    id: UUIDString;
    name: string;
    startDate: DateString;
    endDate: DateString;
    description?: string | null;
  } & Trip_Key)[];
}

export interface Media_Key {
  id: UUIDString;
  __typename?: 'Media_Key';
}

export interface Trip_Key {
  id: UUIDString;
  __typename?: 'Trip_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreatePublicTripRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicTripVariables): MutationRef<CreatePublicTripData, CreatePublicTripVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreatePublicTripVariables): MutationRef<CreatePublicTripData, CreatePublicTripVariables>;
  operationName: string;
}
export const createPublicTripRef: CreatePublicTripRef;

export function createPublicTrip(vars: CreatePublicTripVariables): MutationPromise<CreatePublicTripData, CreatePublicTripVariables>;
export function createPublicTrip(dc: DataConnect, vars: CreatePublicTripVariables): MutationPromise<CreatePublicTripData, CreatePublicTripVariables>;

interface GetPublicTripsRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicTripsData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetPublicTripsData, undefined>;
  operationName: string;
}
export const getPublicTripsRef: GetPublicTripsRef;

export function getPublicTrips(): QueryPromise<GetPublicTripsData, undefined>;
export function getPublicTrips(dc: DataConnect): QueryPromise<GetPublicTripsData, undefined>;

interface CreateActivityForDestinationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateActivityForDestinationVariables): MutationRef<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateActivityForDestinationVariables): MutationRef<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;
  operationName: string;
}
export const createActivityForDestinationRef: CreateActivityForDestinationRef;

export function createActivityForDestination(vars: CreateActivityForDestinationVariables): MutationPromise<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;
export function createActivityForDestination(dc: DataConnect, vars: CreateActivityForDestinationVariables): MutationPromise<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;

interface GetActivitiesForDestinationRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetActivitiesForDestinationVariables): QueryRef<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetActivitiesForDestinationVariables): QueryRef<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
  operationName: string;
}
export const getActivitiesForDestinationRef: GetActivitiesForDestinationRef;

export function getActivitiesForDestination(vars: GetActivitiesForDestinationVariables): QueryPromise<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
export function getActivitiesForDestination(dc: DataConnect, vars: GetActivitiesForDestinationVariables): QueryPromise<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;

