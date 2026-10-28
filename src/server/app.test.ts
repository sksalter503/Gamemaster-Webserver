import { describe, expect, it, vi } from "vitest";
import app from "./app";
import request from "supertest";
import { addInitiativeToRoom, getAllJoinedRoomsByUserId, getInitiativesInRoom, updateTurnIndex } from "./roomService";
import { InitiativeEntity } from "./entity/initiative.entity";
import { RoomEntity } from "./entity/room.entity";
import { createInitiative } from "./initiativeService";
import { getUserById } from "./userService";
import { UserEntity } from "./entity/user.entity";

vi.mock("./roomService", () => ({
    getCombatStatus: vi.fn(() => ({ combatStarted: false, turnIndex: 0 })),
    getInitiativesInRoom: vi.fn(() => [testInitiative]),
    updateTurnIndex: vi.fn(),
    addInitiativeToRoom: vi.fn(),
    getAllJoinedRoomsByUserId: vi.fn()
}));

vi.mock("./userService", () => ({
    getUserById: vi.fn()
}));

vi.mock("./initiativeService", () => ({
    createInitiative: vi.fn(),
    getInitiativesInRoom: vi.fn(),
    updateTurnIndex: vi.fn(),
    addInitiativeToRoom: vi.fn(),
    getAllJoinedRoomsByUserId: vi.fn(),
    getUserById: vi.fn()
}));

const testInitiative = {
    id: "test initiative",
    user: null,
    room: "test room",
    name: "Test initiative",
    initiative: 10,
    health: 100,
    maxHealth: 100,
    hideHealthValue: false,
    hideHealthBar: false,
    status: []
}

const testUser = {
    id: "testUser",
    username: "username",
    password: "password",
    initiatives: [testInitiative]
}

describe("Successful POST /initiatives", () => {
    it("creates an initiative and returns 201", async () => {
        // The module mock applies to this test file; set this mock's behavior for this test.
        vi.mocked(getInitiativesInRoom).mockResolvedValue([testInitiative as unknown as InitiativeEntity]);
        vi.mocked(updateTurnIndex).mockResolvedValue(undefined as unknown as RoomEntity);
        vi.mocked(createInitiative).mockResolvedValue(testInitiative as unknown as InitiativeEntity);
        vi.mocked(addInitiativeToRoom).mockResolvedValue(undefined as unknown as RoomEntity);

        const response = await request(app)
            .post("/initiative")
            .send(
                {
                    initiative: testInitiative,
                    user: testUser,
                    roomId: "test room"
                }
            );

        expect(response.status).toBe(201);
        expect(response.body).toEqual(expect.objectContaining({ name: "Test initiative" }));
    });
});

describe("Failed POST /initiatives", () => {
    it("returns 400 when initiative data is missing", async () => {
        const response = await request(app)
            .post("/initiative")
            .send(
                {
                    user: testUser,
                    roomId: "test room"
                }
            );

        expect(response.status).toBe(400);
    });
})

describe("Successful get /rooms/:id", () => {
    it("returns 200 and the user's rooms", async () => {

        vi.mocked(getAllJoinedRoomsByUserId).mockResolvedValue([{ id: "test room" } as unknown as RoomEntity]);

        const response = await request(app)
            .get("/rooms/testUser");

        expect(response.status).toBe(200);
        expect(response.body).toEqual([{ id: "test room" }]);
    });
});

describe("Failed get rooms/:id", () => {
    it("returns 404 when the user id is invalid", async () => {
        vi.mocked(getUserById).mockResolvedValue(null);

        const response = await request(app)
            .get("/rooms/nonexistentUser");

        expect(response.status).toBe(404);
    });
});

describe("Failed get rooms/:id", () => {
    it("returns 500 when there is an error gettings the rooms", async () => {
        vi.mocked(getUserById).mockResolvedValue({ id: "testUser" } as unknown as UserEntity);
        vi.mocked(getAllJoinedRoomsByUserId).mockRejectedValue(new Error("Database error"));

        const response = await request(app)
            .get("/rooms/testUser");

        expect(response.status).toBe(500);
    });

});

//TODO: Add more tests for this.