/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const getUser = /* GraphQL */ `
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      username
      email
      playlists {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listUsers = /* GraphQL */ `
  query ListUsers(
    $filter: ModelUserFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listUsers(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        username
        email
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getPlaylist = /* GraphQL */ `
  query GetPlaylist($id: ID!) {
    getPlaylist(id: $id) {
      id
      name
      userID
      user {
        id
        username
        email
        createdAt
        updatedAt
        __typename
      }
      playlistSongs {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listPlaylists = /* GraphQL */ `
  query ListPlaylists(
    $filter: ModelPlaylistFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listPlaylists(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        name
        userID
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const getSong = /* GraphQL */ `
  query GetSong($id: ID!) {
    getSong(id: $id) {
      id
      title
      artist
      playlistSongs {
        nextToken
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const listSongs = /* GraphQL */ `
  query ListSongs(
    $filter: ModelSongFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listSongs(filter: $filter, limit: $limit, nextToken: $nextToken) {
      items {
        id
        title
        artist
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const playlistsByUserID = /* GraphQL */ `
  query PlaylistsByUserID(
    $userID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPlaylistFilterInput
    $limit: Int
    $nextToken: String
  ) {
    playlistsByUserID(
      userID: $userID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        name
        userID
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const playlistSongsByPlaylistID = /* GraphQL */ `
  query PlaylistSongsByPlaylistID(
    $playlistID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPlaylistSongsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    playlistSongsByPlaylistID(
      playlistID: $playlistID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        playlistID
        songID
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
export const playlistSongsBySongID = /* GraphQL */ `
  query PlaylistSongsBySongID(
    $songID: ID!
    $sortDirection: ModelSortDirection
    $filter: ModelPlaylistSongsFilterInput
    $limit: Int
    $nextToken: String
  ) {
    playlistSongsBySongID(
      songID: $songID
      sortDirection: $sortDirection
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        id
        playlistID
        songID
        createdAt
        updatedAt
        __typename
      }
      nextToken
      __typename
    }
  }
`;
