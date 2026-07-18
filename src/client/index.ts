import { Room } from '../shared/room';
import { userPromise } from './login';
import { API_URL } from '../shared/consts';


(async () => {
    try {
        const user = await userPromise;

        if (user) {

            //Show the roomsContainer
            const roomsContainer = document.getElementById('roomsContainer') as HTMLDivElement;
            console.log(`roomsContainer: ${roomsContainer}`);
            roomsContainer.style.display = 'block';

            const loginContainer = document.getElementById('loginContainer') as HTMLDivElement;
            console.log(`loginContainer: ${loginContainer}`);
            loginContainer.style.display = 'none';

            //Get the roomsContainer and add a table with all the rooms the player is in
            const roomsTable = document.getElementById('roomsTable') as HTMLTableElement;
            const rooms: Room[] = await fetch(`${API_URL}/rooms/${user.id}`).then(res => res.json());

            //For each room, create a table row with the room name and a button to join
            rooms.forEach(room => {
                const row = roomsTable.insertRow();
                const nameCell = row.insertCell(0);
                nameCell.innerText = room.name;

                const joinCell = row.insertCell(1);
                const joinButton = document.createElement('button');
                joinButton.innerText = 'Enter';
                joinButton.addEventListener('click', () => {
                    //Redirect to the room page with the room id as a query parameter
                    window.location.href = `initiative-sender?roomId=${room.id}`;
                });
                joinCell.appendChild(joinButton);

                //Figure out if the user is the admin of the room, or just a memeber
                const removeCell = row.insertCell(2);
                if (room.admin.id === user.id) {
                    joinButton.innerText = 'Host';
                    const deleteButton = document.createElement('button');
                    deleteButton.innerText = 'Delete';
                    deleteButton.addEventListener('click', async () => {
                        deleteButton.setAttribute('disabled', 'true');
                        if (confirm(`Are you sure you want to delete the room "${room.name}"? This action cannot be undone.`)) {
                            try {
                                const response = await fetch(`${API_URL}/room/${room.id}`, {
                                    method: 'DELETE'
                                });
                                if (response.ok) {
                                    //Room has been deleted successfully, reload the page to show the new room in the list
                                    location.reload();
                                } else {
                                    console.error('Failed to delete room');
                                }
                            } catch (error) {
                                console.error('Error deleting room:', error);
                            }
                        }
                        deleteButton.removeAttribute('disabled');
                    });
                    removeCell.appendChild(deleteButton);
                } else {
                    const leaveButton = document.createElement('button');
                    leaveButton.innerText = 'Leave';
                    leaveButton.addEventListener('click', async () => {
                        leaveButton.setAttribute('disabled', 'true');
                        if (confirm(`Are you sure you want to leave the room "${room.name}"?`)) {
                            try {
                                const response = await fetch(`${API_URL}/room/${room.id}/leave/${user!.id}`, {
                                    method: 'POST'
                                });
                                if (response.ok) {
                                    //Room has been left successfully, reload the page to show the new room in the list
                                    location.reload();
                                } else {
                                    console.error('Failed to leave room');
                                }
                            } catch (error) {
                                console.error('Error leaving room:', error);
                            }
                        }
                        leaveButton.removeAttribute('disabled');
                    });
                    removeCell.appendChild(leaveButton);
                }
            });

            //Get the roomJoinForm and add an event listener to join a room
            const roomJoinForm = document.getElementById('roomJoinForm') as HTMLFormElement;
            roomJoinForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const roomId = (document.getElementById('joinRoomId') as HTMLInputElement).value;
                if (roomId) {
                    const response = await fetch(`${API_URL}/room/${roomId}/join/${user!.id}`, {
                        method: 'POST'
                    });
                    if (response.ok) {
                        //Room has been joined successfully, reload the page to show the new room in the list
                        location.reload();
                    } else {
                        console.error('Failed to join room');
                    }
                }
            });

            //Get the roomCreateForm and add an event listener to create a new room
            const roomCreateForm = document.getElementById('roomCreateForm') as HTMLFormElement;
            roomCreateForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const roomName = (document.getElementById('newRoomName') as HTMLInputElement).value;
                if (roomName) {
                    const response = await fetch(`${API_URL}/room`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name: roomName, adminId: user!.id })
                    });
                    if (response.ok) {
                        //Room has been created successfully, reload the page to show the new room in the list
                        location.reload();
                    } else {
                        console.error('Failed to create room');
                    }
                }
            });

        }
    } catch (error) {
        console.error('Error:', error);
    }
})();
