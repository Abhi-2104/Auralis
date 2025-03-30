/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreateUser = /* GraphQL */ `
  subscription OnCreateUser($filter: ModelSubscriptionUserFilterInput) {
    onCreateUser(filter: $filter) {
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
export const onUpdateUser = /* GraphQL */ `
  subscription OnUpdateUser($filter: ModelSubscriptionUserFilterInput) {
    onUpdateUser(filter: $filter) {
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
export const onDeleteUser = /* GraphQL */ `
  subscription OnDeleteUser($filter: ModelSubscriptionUserFilterInput) {
    onDeleteUser(filter: $filter) {
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
export const onCreatePlaylist = /* GraphQL */ `
  subscription OnCreatePlaylist($filter: ModelSubscriptionPlaylistFilterInput) {
    onCreatePlaylist(filter: $filter) {
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
export const onUpdatePlaylist = /* GraphQL */ `
  subscription OnUpdatePlaylist($filter: ModelSubscriptionPlaylistFilterInput) {
    onUpdatePlaylist(filter: $filter) {
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
export const onDeletePlaylist = /* GraphQL */ `
  subscription OnDeletePlaylist($filter: ModelSubscriptionPlaylistFilterInput) {
    onDeletePlaylist(filter: $filter) {
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
export const onCreateSong = /* GraphQL */ `
  subscription OnCreateSong($filter: ModelSubscriptionSongFilterInput) {
    onCreateSong(filter: $filter) {
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
export const onUpdateSong = /* GraphQL */ `
  subscription OnUpdateSong($filter: ModelSubscriptionSongFilterInput) {
    onUpdateSong(filter: $filter) {
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
export const onDeleteSong = /* GraphQL */ `
  subscription OnDeleteSong($filter: ModelSubscriptionSongFilterInput) {
    onDeleteSong(filter: $filter) {
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
export const onCreatePlaylistSongs = /* GraphQL */ `
  subscription OnCreatePlaylistSongs(
    $filter: ModelSubscriptionPlaylistSongsFilterInput
  ) {
    onCreatePlaylistSongs(filter: $filter) {
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
export const onUpdatePlaylistSongs = /* GraphQL */ `
  subscription OnUpdatePlaylistSongs(
    $filter: ModelSubscriptionPlaylistSongsFilterInput
  ) {
    onUpdatePlaylistSongs(filter: $filter) {
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
export const onDeletePlaylistSongs = /* GraphQL */ `
  subscription OnDeletePlaylistSongs(
    $filter: ModelSubscriptionPlaylistSongsFilterInput
  ) {
    onDeletePlaylistSongs(filter: $filter) {
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
