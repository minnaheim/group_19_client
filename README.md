# Movie Night Planner

## Introducing the Movie Night Planner

Movie Night Planner is a collaborative web application that simplifies group decision-making for movie selection.
Coordinating movie tastes among friends can be challenging, so our solution enables users to create personal profiles,
create and manage their Watch List (which is the list of movies a user wants so watch) and form groups. In those groups,
members can contribute to the group's pool of movies by adding up to two movies from their respective Watch List to it.  
Upon entering the voting phase, the movie pooling phase is closed automatically (thus no more movies can be added to the
group's movie pool). In the voting phase group members have the option to rank the movies in the group's movie pool.
Finally, the Movie Night Planner will announce the winning movie, which is the movie which represent the group members
preferences the best.<br />
Users can add films the Watch List via Search Movies. Upon accessing this page, the Movie Night Planner will provide the
user with personalized movie suggestions. Here the Movie Night Planner makes use of the user's genre, actor and director
favorites, which can be changed under the users profile. Movies can also be search for via title. The advances search
allows users to specify year, genres, actors and directors.<br />
The necessary data on movies, actors and directors is provided by the external TMDb API: https://developer.themoviedb.org/docs/getting-started

## Technologies

**Front-End:**

- [REACT](https://react.dev) - The web framework used
- [NEXT JS](https://nextjs.org) - The React Framework used
- [Tailwind](https://tailwindcss.com) - CSS framework for styling
- [Deno](https://deno.com) - The JavaScript Runtime

<!-- - [smth](https://maven.apache.org/) - Dependency Management
- [smth](https://rometools.github.io/rome/) - Used to generate RSS Feeds -->

## High-level components

The Movie Night Planner application is divided into the following main components, spanning both backend and frontend repositories:

1. ### User Management

   Role: Handles user registration, authentication, profiles, and preference management. This component allows users to create accounts, log in, update personal information, and set movie preferences that drive personalized recommendations.<br />
   Correlation: Acts as the foundation for the entire application, enabling personalized movie recommendations and connecting users to groups and friends.<br />

   - Backend Key Files:<br />
     - [UserService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/UserService.java):<br />
       Core service handling user authentication, registration, and profile management<br />
     - [UserFavoritesService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/UserFavoritesService.java):<br />
       Manages user's favorite genres, actors, and directors<br />
     - [User.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/User.java): <br />
       Entity model defining user properties and relationships<br />
     - [UserController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/UserController.java): <br />
       Endpoints for user operations<br />
     - [UserFavoritesController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/UserFavoritesController.java):<br />
       Endpoints for managing user preferences<br />
   - Frontend Key Files:<br />
     - [favorite_genres/page.tsx](<https://github.com/minnaheim/group_19_client/blob/main/src/app/(favorites)/favorite_genres/page.tsx>): <br />
       UI for selecting and managing preferred genres<br />
     - [favorite_movies/page.tsx](<https://github.com/minnaheim/group_19_client/blob/main/src/app/(favorites)/favorite_movies/page.tsx>): <br />
       UI for selecting favorite movies<br />
     - [profile/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/profile/page.tsx):<br />
       User profile display page<br />
     - [edit_profile/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/edit_profile/page.tsx):<br />
       UI for editing user profile information and preferences <br />

2. ### Group Management

   Role: Manages the complete lifecycle of movie groups - from creation and configuration to invitations and member management. Provides core functionality for collaborative movie selection within defined social circles.<br />
   Correlation: Serves as the collaborative hub connecting User Management with the Movie Pool and Voting components.<br />

   - Backend Key Files:<br />
     - [GroupController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/GroupController.java): <br />
       REST endpoints for group operations<br />
     - [GroupInvitationController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/GroupInvitationController.java):<br />
       Manages invitation processes between users<br />
     - [Group.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/Group.java): <br />
       Entity defining group properties and relationships<br />
     - [MoviePool.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/MoviePool.java): <br />
       Collection model for group's candidate movies<br />
     - [GroupInvitationService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/GroupInvitationService.java):<br />
       Logic for managing invitations<br />
     - [GroupService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/GroupService.java): <br />
       Core service for group operations<br />
     - [MoviePoolService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/MoviePoolService.java):<br />
       Manages the collection of candidate movies for groups<br />
   - Frontend Key Files:<br />
     - [groups/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/groups/page.tsx): <br />
       Dashboard displaying user's groups<br />
     - [pool/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/groups/%5BgroupId%5D/pool/page.tsx): <br />
       UI for viewing and managing group's movie pool<br />

3. ### Movie Management

   Role: Provides the core movie data infrastructure, handling external API integration with TMDb, local movie database operations, and sophisticated search and recommendation algorithms. Centralizes all movie-related operations into a cohesive service layer.<br />
   Correlation: Acts as the primary data provider for all movie-related components including Watchlists, Group Pools, and voting mechanisms.<br />

   - Backend Key Files:<br />
     - [MovieController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/MovieController.java):<br />
       Endpoints for movie operations<br />
     - [Movie.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/Movie.java): <br />
       Entity model with movie attributes and relationships<br />
     - [MovieService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/MovieService.java): <br />
       Core service implementing movie logic<br />
     - [TMDbService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/TMDbService.java):<br />
       Integration service with the external TMDb API<br />
   - Frontend Key Files:<br />
     - [movie_search/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/movie_search/page.tsx):<br />
       UI for searching for movies with filters and movie recommendation display<br />

4. ### Watchlist & Already Seen Movies

   Role: Provides personal movie collection management capabilities, allowing users to maintain lists of movies they wish to watch and those they've already seen. Incorporates rating functionality to improve recommendation accuracy.<br />
   Correlation: Connects user preferences with movie data and supplies candidate movies for group pools.<br />

   - Backend Key Files:<br />
     - [UserMovieController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/UserMovieController.java): <br />
       Endpoints for user-movie relationships<br />
     - [UserMovieService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/UserMovieService.java): <br />
       Service managing user's movie lists and interactions<br />
   - Frontend Key Files:<br />
     - [seen_list/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/seen_list/page.tsx): <br />
       UI for managing watched movies<br />
     - [watchlist/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/watchlist/page.tsx): <br />
       UI for managing movies to watch<br />

5. ### Voting System

   Role: Implements a sophisticated preferential voting algorithm that processes group members' movie rankings to determine the optimal movie choice. Manages the complete voting workflow from ballot creation to result calculation and announcement.<br />
   Correlation: Represents the decision-making core of the application, integrating with Group Management and Movie Pool components.<br />

   - Backend Key Files:<br />
     - [RankingController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/RankingController.java): <br />
       Endpoint for submitting and retrieving rankings<br />
     - [RankingResult.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/RankingResult.java):<br />
       Entity storing voting outcome data<br />
     - [RankingSubmissionLog.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/RankingSubmissionLog.java):<br />
       Vote submissions<br />
     - [UserMovieRanking.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/UserMovieRanking.java):<br />
       Entity representing a user's movie preferences<br />
     - [RankingScheduler.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/scheduler/RankingScheduler.java): <br />
       Service managing voting deadlines<br />
     - [RankingService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/RankingService.java):<br />
       Service implementing voting algorithms<br />
   - Frontend Key Files:<br />
     - [results/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/groups/%5BgroupId%5D/results/page.tsx):<br />
       Displays voting results and winning movie<br />
     - [vote/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/groups/%5BgroupId%5D/vote/page.tsx): <br />
       Interactive drag-and-drop interface for ranking movies<br />

6. ### Friendship Management
   Role: Enables social connections between users through a friend request and acceptance system. Facilitates discovery of other users and provides visibility into friends' movie preferences and watchlists to encourage shared experiences.<br />
   Correlation: Enhances the social fabric of the application, supporting easier group formation and encouraging collaborative movie selection.<br />
   - Backend Key Files:<br />
     - [FriendRequestController.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/controller/FriendRequestController.java):<br />
       Endpoints for friend operations<br />
     - [FriendRequest.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/entity/FriendRequest.java): <br />
       Entity model for pending friendship requests<br />
     - [FriendRequestService.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/service/FriendRequestService.java): <br />
       Service handling friendship business logic<br />
   - Frontend Key Files:<br />
     - [friends/page.tsx](https://github.com/minnaheim/group_19_client/blob/main/src/app/users/%5Bid%5D/friends/page.tsx): <br />
       Interface for managing friends and requests<br />

## Launch & Deployment

Please refer to the following files for a description on how to get started with this application, including
which commands are required to build and run this project locally and how to run tests.

- [Launch_and_Deployment_Client.md](https://github.com/minnaheim/group_19_client/blob/main/Launch_and_Deployment_Client.md)
- [Launch_and_Deployment_Server](https://github.com/minnaheim/group_19_server/blob/main/Launch_and_Deployment_Server.md)

### Database:

We built the data base to work in two ways:

- If run locally, the Database was in memory, so that it only lasts for the length that the database runs
- Once deployed, an external PostgreSQL database was used through [Supabase](https://supabase.com) which offers free databases for small projects.

### TMDb API: We requested an API key under the following link:<br />

https://www.themoviedb.org/settings/api<br />
We've stored it in the server's Github Secrets, refer to
[TMDbConfig.java](https://github.com/minnaheim/group_19_server/blob/main/src/main/java/ch/uzh/ifi/hase/soprafs25/config/TMDbConfig.java)

## Illustrations

We defined the following main user flows:

1. **Onboarding**

   When the user first reaches our app, they can get started by registering for the app, which entails setting basic user preferences. This means the user can register their favorite genres, and one favorite movie. Once this onboarding process is completed, they are sent to the profile page, where they can see their preferences and add additional preferences if they want to, e.g. favorite actors and directors.

2. **Movie Adding**
   Users can go to the Watch List page, where they can manually search for films they want to watch or receive suggestions from our algorithm as to which films they might be interested in. The same goes for Mark as Seen, where users can input which films they have already seen. This is useful because users can save their preferences, for example, to be reminded of films they want to watch. It is also useful because users' friends can see the films they have marked.

3. **Group Movie Selection**

   Once they have sent friend requests and their friends have accepted them, users can form a movie group on the Movie Groups page. Once they have added their friends to the group and they have accepted the invitation, users can set a timer for adding movies to the pool. Once the members have added two movies to the pool, they can proceed to voting, which can also have a time limit, where they rank the movie selections. The movie result is then shown. The user can go to the Watch List page, where they can manually search for movies they want to watch or get suggestions from our algorithm as to which movies they might like. The same goes for the Watched List, where users can input which films they have already seen. This is useful because users can save their preferences, for example, to be reminded of films they want to watch. It is also useful because users' friends can see the films they have marked.

## Roadmap

We suggest adding these features to this project:

- Adding an additional list (besides the existing lists: Watch List and Already Seen) so that users can dismiss movies suggested. The endpoint GET /movies/suggestions/{userId} needs to be updated, so that these movies in this "dismissed/ do not like list" are filtered out and so that other movies are suggested.
- Add YouTube functionality to the project: Applying for a youtube API Key, and displaying trailer directly in the Movie Night Planner instead of redirecting to youtube. https://developers.google.com/youtube/v3?hl=en
- Providing the same functionalities for TV Series's as well

## Authors and acknowledgment.

- **Benedikt Jung** - [BeneJung](https://github.com/BeneJung)
- **Elisabeth Philippi** - [ellaruby0](https://github.com/ellaruby0)
- **Anabel Nigsch** - [AnabelNigsch](https://github.com/AnabelNigsch)
- **Minna Heim** - [minnaheim](https://github.com/minnaheim)
- **Ivan Isaenko** - [ivis-ii](https://github.com/ivis-ii)

Refer also to [contributions.md](https://github.com/minnaheim/group_19_client/blob/main/contributions.md)

## License

The Front-End was deployed using [Vercel](https://vercel.com/miinnas-projects) where the deployment errors, such as un-escaped apostrophes were shown. The backend was deployed using [Google Cloud](https://cloud.google.com/gcp?utm_source=google&utm_medium=cpc&utm_campaign=emea-ch-all-de-bkws-all-all-trial-e-gcp-1707574&utm_content=text-ad-none-any-DEV_c-CRE_554508006169-ADGP_Hybrid+%7C+BKWS+-+EXA+%7C+Txt+-+GCP+-+General+-+v3-KWID_43700060389294309-kwd-6458750523-userloc_9194482&utm_term=KW_google+cloud-NET_g-PLAC_&&gclsrc=aw.ds&gad_source=1&gad_campaignid=12168596156&gclid=Cj0KCQjwiqbBBhCAARIsAJSfZkaBxm-zUAnQ24jZVPrlAdrmpzcFWOvZy0Fl2WgxiT9Ko_XBmvRJzjsaAi08EALw_wcB&hl=en) where the App Engine was used to show deployment errors or any such problems.

MIT License

Copyright (c) [2025] [Minna Heim]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
