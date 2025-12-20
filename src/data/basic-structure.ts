export interface ILocations{
  id: string,
  title: string,
  latitude: number,
  longitude: number,
  audioPath: string,
  played: boolean
}


export const storyLocations: ILocations[] = [
  {
    id: '1',
    title: 'Fuente del Amor',
    latitude: 40.7128,
    longitude: -74.0060,
    audioPath: 'audio/story_fountain.mp3',
    played: false, // Para rastrear si ya se reprodujo
  },
];
