# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---

## Contributions Week 1 - [26.04.2025] to [01.04.2025]

| **Student**      | **Date** | **Link to Commit**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | **Description**                 | **Relevance**                       |
|------------------| -------- |------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------| ------------------------------- | ----------------------------------- |
| **BeneJung**     | 01.04.2024   | https://github.com/minnaheim/group_19_server/commit/9b55b3a0a49af22ded5a4c08a927006ed813a52f   | Implementation of functionalities for want-to-watch list and watched list. | These lists allow a user to persistenly save personal preferences, by savinf movies as preferences that the user wants to watch or by saving movies as already watched. This is one of the key components of our application. |
| **BeneJung**     | 01.04.2024   | https://github.com/minnaheim/group_19_server/commit/be54ab985b94513f3bd2978e1b7a084659352658, https://github.com/minnaheim/group_19_server/commit/e7ad597fef1aea85b20bb8b1d0af7745595846ec  | Many Tests for the want-to-watch list and watched list and their functionalities as well as for login, logout and registration. | Tests are important and necessary but timeconsuming part of the project. |
|  **BeneJung**    | 01.04.2024   | https://github.com/minnaheim/group_19_server/commit/b8ef7f8c5374ae23998c95d4c38c56a6a5abca9d, https://github.com/minnaheim/group_19_server/commit/92377e2f9aa9a61f789ea17d184fc516cbb83c90, https://github.com/minnaheim/group_19_server/commit/214f3fae3815c6bfa1a1b06b6d8c4b661fe6be80        | Two additions regarding login and registration: 1. logout functionality and 2. availabilty check of username and email. Also, some minor fixes. | To ensure that the functionalities are give and work, also ensured a coherent naming scheme in main code and tests. |
| **ellaruby0**    | 01.04.2024   |https://github.com/minnaheim/group_19_client/commit/fe9144eabb671c7470bd4c295648409af1e7aad6, https://github.com/minnaheim/group_19_client/commit/8a311c7e17fd7680612ba65fd0813945f97280f1, https://github.com/minnaheim/group_19_client/commit/bdc7d254c3eeb2cafb44fecff726712ea02f5a7b, https://github.com/minnaheim/group_19_client/commit/0270896b977667ed3e70f28d9f4ddcdcabb421df| View and Edit Profile Page|  |
|                  | 01.04.2024    |https://github.com/minnaheim/group_19_client/commit/a647fc49fb4636c0b28fb465cb42be0559031ed9, https://github.com/minnaheim/group_19_client/commit/e244fa27e245165ab05f11ddc454550008fcbc57| View, edit and search Watch List|  |
|   | 01.04.2024   |https://github.com/minnaheim/group_19_client/commit/a5014aad963680379275af60d03d52d82a52169c, https://github.com/minnaheim/group_19_client/commit/e244fa27e245165ab05f11ddc454550008fcbc57| View, edit and search Seen List||
|                  | 01.04.2024    |https://github.com/minnaheim/group_19_client/commit/c08f8a7611b30012fd0e3c4078f581d448c32054, https://github.com/minnaheim/group_19_client/commit/0720830fe869d0856fbb6dbb859fcc82f2235ce5, https://github.com/minnaheim/group_19_client/commit/a771b59ce682c1dbaae6588f10a5c3a8b822617e, https://github.com/minnaheim/group_19_client/commit/ba9b1ce0e3d866c62ef3a1837e3a006f07b9a80a | Navigation component|  |
| **AnabelNigsch** | 28.03.2025 | https://github.com/minnaheim/group_19_server/pull/297/commits/d6537797397db9089a1ef3a2db09b121b0071ab8, https://github.com/minnaheim/group_19_server/pull/297/commits/2507cc671636771078cba9a4f14d5fcee6b61677, https://github.com/minnaheim/group_19_server/pull/297/commits                                                                                                                                                                                                                                                            | Created Movie Object, inlcuding files (MovieController.java, Movie.java, MovieRepository.java, MovieGetDTO.java, MovieService.java and modified DTOMapper.java accordingly) | I defined the Movie entity including attributes such as title, genre, year, cast, and additional details. By creating the MovieController and associated endpoints, I enable frontend to search, retrieve, and view detailed movie information. |
|     **AnabelNigsch**           | 30.03.2025 | https://github.com/minnaheim/group_19_server/pull/297/commits/91af3b1b5877ede566e677cb74b49904f59a8db9, https://github.com/minnaheim/group_19_server/pull/297/commits/31a1575628ee41d8199cd7a21c0ae50fb19d0bf5, https://github.com/minnaheim/group_19_server/pull/297/commits/9596a3c713b7e69ec3ddca2c359c22d9b6dc08bd, https://github.com/minnaheim/group_19_server/pull/297/commits/d8e5c5ef49827d006a908abdeffea07bb6a337be, https://github.com/minnaheim/group_19_server/pull/297/commits/90db5ab246890a6605f102ec34c38db62842e32e, https://github.com/minnaheim/group_19_server/pull/297/commits | TMDb API for movie data incl. genre list form TMDb API, creation of files (SearchValidationExeption, RestTemplateConfig, TMDbConfig, TMDbService, application-local.properties, local.properties) | My TMDb API integration allows the application to fetch movie data. By integrating the endpoint that fetches genre information, the application can offer users additional filtering criteria. This enhances the search functionality and improves user experience by enabling genre-based exploration of movies. I ensured that invalid queries are properly managed. This leads to more robust and user-friendly interactions during movie searches. I created the logic for communicating with the TMDb API, mapping responses to the Movie entity, and providing detailed movie information. |
| **minnaheim**    | [date]   | [Link to Commit 1]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2]                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | [Brief description of the task] | [Why this contribution is relevant] |
| **ivis-ii**      | 01.04.2025   | https://github.com/minnaheim/group_19_server/commit/598247710c70ee1d6c0c5c9aa6167fabd84c8e71 | Modify User and create Group Entities, login and authentication - UserService and UserController modifications. (probably a bit less than 100% of a meaningful task)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | [Brief description of the task] | [Why this contribution is relevant] |
|                  | 01.04.2025   |  https://github.com/minnaheim/group_19_server/commit/8f9b063b5947cc6745ea972125fa739f07795389 | Friends functionality: entity, repository, service and controller for FriendRequest. Also some changes to User entity to make it connected. (probably more than 100% of a meaningful task)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      | [Brief description of the task] | [Why this contribution is relevant] |
---

## Contributions Week 2 - [02.04.2025] to [08.04.2025]

| **Student**      | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
|------------------| -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **BeneJung**     | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ellaruby0**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **AnabelNigsch** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **minnaheim**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ivis-ii**      | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
---


## Contributions Week 3 - [09.04.2025] to [15.04.2025]


| **Student**      | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
|------------------| -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **BeneJung**     | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ellaruby0**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **AnabelNigsch** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **minnaheim**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ivis-ii**      | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
---


## Contributions Week 4 - [16.04.2025] to [22.04.2025]


| **Student**      | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
|------------------| -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **BeneJung**     | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ellaruby0**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **AnabelNigsch** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **minnaheim**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ivis-ii**      | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
---


## Contributions Week 5 - [30.04.2025] to [06.05.2025]


| **Student**      | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
|------------------| -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **BeneJung**     | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ellaruby0**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **AnabelNigsch** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **minnaheim**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ivis-ii**      | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
---


## Contributions Week 6 - [07.05.2025] to [13.05.2025]


| **Student**      | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
|------------------| -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **BeneJung**     | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ellaruby0**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **AnabelNigsch** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **minnaheim**    | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **ivis-ii**      | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                  | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
---
