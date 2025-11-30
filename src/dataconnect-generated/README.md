# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetPublicTrips*](#getpublictrips)
  - [*GetActivitiesForDestination*](#getactivitiesfordestination)
- [**Mutations**](#mutations)
  - [*CreatePublicTrip*](#createpublictrip)
  - [*CreateActivityForDestination*](#createactivityfordestination)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetPublicTrips
You can execute the `GetPublicTrips` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getPublicTrips(): QueryPromise<GetPublicTripsData, undefined>;

interface GetPublicTripsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetPublicTripsData, undefined>;
}
export const getPublicTripsRef: GetPublicTripsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getPublicTrips(dc: DataConnect): QueryPromise<GetPublicTripsData, undefined>;

interface GetPublicTripsRef {
  ...
  (dc: DataConnect): QueryRef<GetPublicTripsData, undefined>;
}
export const getPublicTripsRef: GetPublicTripsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getPublicTripsRef:
```typescript
const name = getPublicTripsRef.operationName;
console.log(name);
```

### Variables
The `GetPublicTrips` query has no variables.
### Return Type
Recall that executing the `GetPublicTrips` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetPublicTripsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetPublicTripsData {
  trips: ({
    id: UUIDString;
    name: string;
    startDate: DateString;
    endDate: DateString;
    description?: string | null;
  } & Trip_Key)[];
}
```
### Using `GetPublicTrips`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getPublicTrips } from '@dataconnect/generated';


// Call the `getPublicTrips()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getPublicTrips();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getPublicTrips(dataConnect);

console.log(data.trips);

// Or, you can use the `Promise` API.
getPublicTrips().then((response) => {
  const data = response.data;
  console.log(data.trips);
});
```

### Using `GetPublicTrips`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getPublicTripsRef } from '@dataconnect/generated';


// Call the `getPublicTripsRef()` function to get a reference to the query.
const ref = getPublicTripsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getPublicTripsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.trips);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.trips);
});
```

## GetActivitiesForDestination
You can execute the `GetActivitiesForDestination` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getActivitiesForDestination(vars: GetActivitiesForDestinationVariables): QueryPromise<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;

interface GetActivitiesForDestinationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetActivitiesForDestinationVariables): QueryRef<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
}
export const getActivitiesForDestinationRef: GetActivitiesForDestinationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getActivitiesForDestination(dc: DataConnect, vars: GetActivitiesForDestinationVariables): QueryPromise<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;

interface GetActivitiesForDestinationRef {
  ...
  (dc: DataConnect, vars: GetActivitiesForDestinationVariables): QueryRef<GetActivitiesForDestinationData, GetActivitiesForDestinationVariables>;
}
export const getActivitiesForDestinationRef: GetActivitiesForDestinationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getActivitiesForDestinationRef:
```typescript
const name = getActivitiesForDestinationRef.operationName;
console.log(name);
```

### Variables
The `GetActivitiesForDestination` query requires an argument of type `GetActivitiesForDestinationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetActivitiesForDestinationVariables {
  destinationId: UUIDString;
}
```
### Return Type
Recall that executing the `GetActivitiesForDestination` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetActivitiesForDestinationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetActivitiesForDestination`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getActivitiesForDestination, GetActivitiesForDestinationVariables } from '@dataconnect/generated';

// The `GetActivitiesForDestination` query requires an argument of type `GetActivitiesForDestinationVariables`:
const getActivitiesForDestinationVars: GetActivitiesForDestinationVariables = {
  destinationId: ..., 
};

// Call the `getActivitiesForDestination()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getActivitiesForDestination(getActivitiesForDestinationVars);
// Variables can be defined inline as well.
const { data } = await getActivitiesForDestination({ destinationId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getActivitiesForDestination(dataConnect, getActivitiesForDestinationVars);

console.log(data.activities);

// Or, you can use the `Promise` API.
getActivitiesForDestination(getActivitiesForDestinationVars).then((response) => {
  const data = response.data;
  console.log(data.activities);
});
```

### Using `GetActivitiesForDestination`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getActivitiesForDestinationRef, GetActivitiesForDestinationVariables } from '@dataconnect/generated';

// The `GetActivitiesForDestination` query requires an argument of type `GetActivitiesForDestinationVariables`:
const getActivitiesForDestinationVars: GetActivitiesForDestinationVariables = {
  destinationId: ..., 
};

// Call the `getActivitiesForDestinationRef()` function to get a reference to the query.
const ref = getActivitiesForDestinationRef(getActivitiesForDestinationVars);
// Variables can be defined inline as well.
const ref = getActivitiesForDestinationRef({ destinationId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getActivitiesForDestinationRef(dataConnect, getActivitiesForDestinationVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.activities);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.activities);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreatePublicTrip
You can execute the `CreatePublicTrip` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createPublicTrip(vars: CreatePublicTripVariables): MutationPromise<CreatePublicTripData, CreatePublicTripVariables>;

interface CreatePublicTripRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreatePublicTripVariables): MutationRef<CreatePublicTripData, CreatePublicTripVariables>;
}
export const createPublicTripRef: CreatePublicTripRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createPublicTrip(dc: DataConnect, vars: CreatePublicTripVariables): MutationPromise<CreatePublicTripData, CreatePublicTripVariables>;

interface CreatePublicTripRef {
  ...
  (dc: DataConnect, vars: CreatePublicTripVariables): MutationRef<CreatePublicTripData, CreatePublicTripVariables>;
}
export const createPublicTripRef: CreatePublicTripRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createPublicTripRef:
```typescript
const name = createPublicTripRef.operationName;
console.log(name);
```

### Variables
The `CreatePublicTrip` mutation requires an argument of type `CreatePublicTripVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreatePublicTripVariables {
  userId: UUIDString;
  name: string;
  startDate: DateString;
  endDate: DateString;
  description?: string | null;
}
```
### Return Type
Recall that executing the `CreatePublicTrip` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreatePublicTripData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreatePublicTripData {
  trip_insert: Trip_Key;
}
```
### Using `CreatePublicTrip`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createPublicTrip, CreatePublicTripVariables } from '@dataconnect/generated';

// The `CreatePublicTrip` mutation requires an argument of type `CreatePublicTripVariables`:
const createPublicTripVars: CreatePublicTripVariables = {
  userId: ..., 
  name: ..., 
  startDate: ..., 
  endDate: ..., 
  description: ..., // optional
};

// Call the `createPublicTrip()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createPublicTrip(createPublicTripVars);
// Variables can be defined inline as well.
const { data } = await createPublicTrip({ userId: ..., name: ..., startDate: ..., endDate: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createPublicTrip(dataConnect, createPublicTripVars);

console.log(data.trip_insert);

// Or, you can use the `Promise` API.
createPublicTrip(createPublicTripVars).then((response) => {
  const data = response.data;
  console.log(data.trip_insert);
});
```

### Using `CreatePublicTrip`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createPublicTripRef, CreatePublicTripVariables } from '@dataconnect/generated';

// The `CreatePublicTrip` mutation requires an argument of type `CreatePublicTripVariables`:
const createPublicTripVars: CreatePublicTripVariables = {
  userId: ..., 
  name: ..., 
  startDate: ..., 
  endDate: ..., 
  description: ..., // optional
};

// Call the `createPublicTripRef()` function to get a reference to the mutation.
const ref = createPublicTripRef(createPublicTripVars);
// Variables can be defined inline as well.
const ref = createPublicTripRef({ userId: ..., name: ..., startDate: ..., endDate: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createPublicTripRef(dataConnect, createPublicTripVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.trip_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.trip_insert);
});
```

## CreateActivityForDestination
You can execute the `CreateActivityForDestination` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createActivityForDestination(vars: CreateActivityForDestinationVariables): MutationPromise<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;

interface CreateActivityForDestinationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateActivityForDestinationVariables): MutationRef<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;
}
export const createActivityForDestinationRef: CreateActivityForDestinationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createActivityForDestination(dc: DataConnect, vars: CreateActivityForDestinationVariables): MutationPromise<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;

interface CreateActivityForDestinationRef {
  ...
  (dc: DataConnect, vars: CreateActivityForDestinationVariables): MutationRef<CreateActivityForDestinationData, CreateActivityForDestinationVariables>;
}
export const createActivityForDestinationRef: CreateActivityForDestinationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createActivityForDestinationRef:
```typescript
const name = createActivityForDestinationRef.operationName;
console.log(name);
```

### Variables
The `CreateActivityForDestination` mutation requires an argument of type `CreateActivityForDestinationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateActivityForDestinationVariables {
  destinationId: UUIDString;
  name: string;
  activityDate: DateString;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  description?: string | null;
}
```
### Return Type
Recall that executing the `CreateActivityForDestination` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateActivityForDestinationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateActivityForDestinationData {
  activity_insert: Activity_Key;
}
```
### Using `CreateActivityForDestination`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createActivityForDestination, CreateActivityForDestinationVariables } from '@dataconnect/generated';

// The `CreateActivityForDestination` mutation requires an argument of type `CreateActivityForDestinationVariables`:
const createActivityForDestinationVars: CreateActivityForDestinationVariables = {
  destinationId: ..., 
  name: ..., 
  activityDate: ..., 
  startTime: ..., // optional
  endTime: ..., // optional
  location: ..., // optional
  description: ..., // optional
};

// Call the `createActivityForDestination()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createActivityForDestination(createActivityForDestinationVars);
// Variables can be defined inline as well.
const { data } = await createActivityForDestination({ destinationId: ..., name: ..., activityDate: ..., startTime: ..., endTime: ..., location: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createActivityForDestination(dataConnect, createActivityForDestinationVars);

console.log(data.activity_insert);

// Or, you can use the `Promise` API.
createActivityForDestination(createActivityForDestinationVars).then((response) => {
  const data = response.data;
  console.log(data.activity_insert);
});
```

### Using `CreateActivityForDestination`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createActivityForDestinationRef, CreateActivityForDestinationVariables } from '@dataconnect/generated';

// The `CreateActivityForDestination` mutation requires an argument of type `CreateActivityForDestinationVariables`:
const createActivityForDestinationVars: CreateActivityForDestinationVariables = {
  destinationId: ..., 
  name: ..., 
  activityDate: ..., 
  startTime: ..., // optional
  endTime: ..., // optional
  location: ..., // optional
  description: ..., // optional
};

// Call the `createActivityForDestinationRef()` function to get a reference to the mutation.
const ref = createActivityForDestinationRef(createActivityForDestinationVars);
// Variables can be defined inline as well.
const ref = createActivityForDestinationRef({ destinationId: ..., name: ..., activityDate: ..., startTime: ..., endTime: ..., location: ..., description: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createActivityForDestinationRef(dataConnect, createActivityForDestinationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.activity_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.activity_insert);
});
```

