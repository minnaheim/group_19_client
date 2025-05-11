export interface ActorDTO {
    id: number;
    name: string;
    profilePath?: string;
    knownFor?: string[];
}

export interface DirectorDTO {
    id: number;
    name: string;
    profilePath?: string;
    knownFor?: string[];
}

export interface Person {
    id: number;
    name: string;
    type: 'actor' | 'director';
}