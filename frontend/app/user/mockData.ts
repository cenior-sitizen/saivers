/**
 * Mock data for My Home page.
 * Room cards - generic for multiple appliances per room.
 */

export interface HomeRoomData {
  id: string;
  name: string;
  slug: string;
}

export const homeRooms: HomeRoomData[] = [
  { id: "master", name: "Master Room", slug: "master-room" },
  { id: "room1", name: "Room 1", slug: "room-1" },
  { id: "room2", name: "Room 2", slug: "room-2" },
  { id: "living", name: "Living Room", slug: "living-room" },
];
