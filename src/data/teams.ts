import { FranchiseTeam } from '../types/auction';

export const FRANCHISE_TEAMS: FranchiseTeam[] = [
  {
    id: 'RCB',
    name: 'Bengaluru Challengers',
    shortName: 'RCB',
    city: 'Bengaluru',
    primaryColor: '#D32F2F', // Crimson Red
    secondaryColor: '#1A1A1A',
    accentColor: '#FFD700', // Gold
    textColor: '#FFFFFF',
    badgeText: 'RC',
    tagline: 'Play Bold',
  },
  {
    id: 'CSK',
    name: 'Chennai Super Kings',
    shortName: 'CSK',
    city: 'Chennai',
    primaryColor: '#FBC02D', // Bright Gold/Yellow
    secondaryColor: '#1565C0',
    accentColor: '#FF9800',
    textColor: '#1A1A1A',
    badgeText: 'CSK',
    tagline: 'Whistle Podu',
  },
  {
    id: 'MI',
    name: 'Mumbai Indians',
    shortName: 'MI',
    city: 'Mumbai',
    primaryColor: '#1976D2', // Ocean Blue
    secondaryColor: '#FFD700',
    accentColor: '#E0E0E0',
    textColor: '#FFFFFF',
    badgeText: 'MI',
    tagline: 'Duniya Hila Denge',
  },
  {
    id: 'KKR',
    name: 'Kolkata Knight Riders',
    shortName: 'KKR',
    city: 'Kolkata',
    primaryColor: '#4A148C', // Deep Purple
    secondaryColor: '#FFD700',
    accentColor: '#7B1FA2',
    textColor: '#FFFFFF',
    badgeText: 'KKR',
    tagline: 'Korbo Lorbo Jeetbo',
  },
  {
    id: 'SRH',
    name: 'Sunrisers Hyderabad',
    shortName: 'SRH',
    city: 'Hyderabad',
    primaryColor: '#F57C00', // Vibrant Orange
    secondaryColor: '#212121',
    accentColor: '#FFE082',
    textColor: '#FFFFFF',
    badgeText: 'SRH',
    tagline: 'Rise Up',
  },
  {
    id: 'RR',
    name: 'Rajasthan Royals',
    shortName: 'RR',
    city: 'Jaipur',
    primaryColor: '#E91E63', // Royal Pink
    secondaryColor: '#0D47A1',
    accentColor: '#F8BBD0',
    textColor: '#FFFFFF',
    badgeText: 'RR',
    tagline: 'Halla Bol',
  },
  {
    id: 'DC',
    name: 'Delhi Capitals',
    shortName: 'DC',
    city: 'Delhi',
    primaryColor: '#0D47A1', // Electric Blue
    secondaryColor: '#D32F2F',
    accentColor: '#64B5F6',
    textColor: '#FFFFFF',
    badgeText: 'DC',
    tagline: 'Roar Macha',
  },
  {
    id: 'GT',
    name: 'Gujarat Titans',
    shortName: 'GT',
    city: 'Ahmedabad',
    primaryColor: '#1A237E', // Navy/Midnight
    secondaryColor: '#C5A059', // Metallic Gold
    accentColor: '#3949AB',
    textColor: '#FFFFFF',
    badgeText: 'GT',
    tagline: 'Aava De',
  },
  {
    id: 'LSG',
    name: 'Lucknow Super Giants',
    shortName: 'LSG',
    city: 'Lucknow',
    primaryColor: '#00838F', // Cyan / Teal
    secondaryColor: '#FF6F00',
    accentColor: '#80DEEA',
    textColor: '#FFFFFF',
    badgeText: 'LSG',
    tagline: 'Ab Apni Baari Hai',
  },
  {
    id: 'PBKS',
    name: 'Punjab Kings',
    shortName: 'PBKS',
    city: 'Mohali',
    primaryColor: '#C62828', // Scarlet Red
    secondaryColor: '#B0BEC5', // Silver
    accentColor: '#EF5350',
    textColor: '#FFFFFF',
    badgeText: 'PBKS',
    tagline: 'Sadda Punjab',
  },
];

export const TEAMS_BY_ID = FRANCHISE_TEAMS.reduce<Record<string, FranchiseTeam>>(
  (acc, team) => {
    acc[team.id] = team;
    return acc;
  },
  {}
);
