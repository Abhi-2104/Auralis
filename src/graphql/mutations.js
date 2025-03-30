/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createUser = /* GraphQL */ `
  mutation CreateUser(
    $input: CreateUserInput!
    $condition: ModelUserConditionInput
  ) {
    createUser(input: $input, condition: $condition) {
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
export const updateUser = /* GraphQL */ `
  mutation UpdateUser(
    $input: UpdateUserInput!
    $condition: ModelUserConditionInput
  ) {
    updateUser(input: $input, condition: $condition) {
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
export const deleteUser = /* GraphQL */ `
  mutation DeleteUser(
    $input: DeleteUserInput!
    $condition: ModelUserConditionInput
  ) {
    deleteUser(input: $input, condition: $condition) {
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
export const createPlaylist = /* GraphQL */ `
  mutation CreatePlaylist(
    $input: CreatePlaylistInput!
    $condition: ModelPlaylistConditionInput
  ) {
    createPlaylist(input: $input, condition: $condition) {
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
export const updatePlaylist = /* GraphQL */ `
  mutation UpdatePlaylist(
    $input: UpdatePlaylistInput!
    $condition: ModelPlaylistConditionInput
  ) {
    updatePlaylist(input: $input, condition: $condition) {
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
export const deletePlaylist = /* GraphQL */ `
  mutation DeletePlaylist(
    $input: DeletePlaylistInput!
    $condition: ModelPlaylistConditionInput
  ) {
    deletePlaylist(input: $input, condition: $condition) {
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
export const createSong = /* GraphQL */ `
  mutation CreateSong(
    $input: CreateSongInput!
    $condition: ModelSongConditionInput
  ) {
    createSong(input: $input, condition: $condition) {
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
export const updateSong = /* GraphQL */ `
  mutation UpdateSong(
    $input: UpdateSongInput!
    $condition: ModelSongConditionInput
  ) {
    updateSong(input: $input, condition: $condition) {
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
export const deleteSong = /* GraphQL */ `
  mutation DeleteSong(
    $input: DeleteSongInput!
    $condition: ModelSongConditionInput
  ) {
    deleteSong(input: $input, condition: $condition) {
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
export const createPlaylistSongs = /* GraphQL */ `
  mutation CreatePlaylistSongs(
    $input: CreatePlaylistSongsInput!
    $condition: ModelPlaylistSongsConditionInput
  ) {
    createPlaylistSongs(input: $input, condition: $condition) {
      id
      playlistID
      songID
      playlist {
        id
        name
        userID
        createdAt
        updatedAt
        __typename
      }
      song {
        id
        title
        artist
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const updatePlaylistSongs = /* GraphQL */ `
  mutation UpdatePlaylistSongs(
    $input: UpdatePlaylistSongsInput!
    $condition: ModelPlaylistSongsConditionInput
  ) {
    updatePlaylistSongs(input: $input, condition: $condition) {
      id
      playlistID
      songID
      playlist {
        id
        name
        userID
        createdAt
        updatedAt
        __typename
      }
      song {
        id
        title
        artist
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
export const deletePlaylistSongs = /* GraphQL */ `
  mutation DeletePlaylistSongs(
    $input: DeletePlaylistSongsInput!
    $condition: ModelPlaylistSongsConditionInput
  ) {
    deletePlaylistSongs(input: $input, condition: $condition) {
      id
      playlistID
      songID
      playlist {
        id
        name
        userID
        createdAt
        updatedAt
        __typename
      }
      song {
        id
        title
        artist
        createdAt
        updatedAt
        __typename
      }
      createdAt
      updatedAt
      __typename
    }
  }
`;
