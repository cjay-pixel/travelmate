import { CreatePublicTripData, CreatePublicTripVariables, GetPublicTripsData, CreateActivityForDestinationData, CreateActivityForDestinationVariables, GetActivitiesForDestinationData, GetActivitiesForDestinationVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreatePublicTrip(options?: useDataConnectMutationOptions<CreatePublicTripData, FirebaseError, CreatePublicTripVariables>): UseDataConnectMutationResult<CreatePublicTripData, CreatePublicTripVariables>;
export function useCreatePublicTrip(dc: DataConnect, options?: useDataConnectMutationOptions<CreatePublicTripData, FirebaseError, CreatePublicTripVariables>): UseDataConnectMutationResult<CreatePublicTripData, CreatePublicTripVariables>;

export function useGetPublicTrips(options?: useDataConnectQueryOptions<GetPublicTripsData>): UseDataConnectQueryResult<GetPublicTripsData, undefined>;
export function useGetPublicTrips(dc: DataConnect, options?: useDataConnectQueryOptions<GetPublicTripsData>): UseDataConnectQueryResult<GetPublicTripsData, undefined>;

export function useCreateActivityForDestination(options?: useDataConnectMutationOptions<CreateActivityForDestinationData, FirebaseError, CreateActivityForDestinationVariables>): UseDataConnectMutationResult<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;
export function useCreateActivityForDestination(dc: DataConnect, options?: useDataConnectMutationOptions<CreateActivityForDestinationData, FirebaseError, CreateActivityForDestinationVariables>): UseDataConnectMutationResult<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;

export function useGetActivitiesForDestination(vars: GetActivitiesForDestinationVariables, options?: useDataConnectQueryOptions<GetActivitiesForDestinationData>): UseDataConnectQueryResult<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
export function useGetActivitiesForDestination(dc: DataConnect, vars: GetActivitiesForDestinationVariables, options?: useDataConnectQueryOptions<GetActivitiesForDestinationData>): UseDataConnectQueryResult<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
