//Create a form for loggin in, which then changes to a logout button if the user is currently logged in.
import Cookies from 'js-cookie';
import { API_URL } from '../shared/consts';
import { User } from '../shared/user';

let loggedIn = false;
let userId = Cookies.get('userId');
export let user: User | undefined = undefined;

if (userId) {
    //User cookie exists:
    console.log(`User cookie found, userId: ${userId}`);
    loggedIn = true;

    //Get user data from server:
    fetch(`${API_URL}/user/${userId}`).then(res => res.json()).then((data: User) => {
        console.log(`User data: ${JSON.stringify(data)}`);
        user = data;
    }).catch(err => {
        //User does not exist
        console.error(`Error fetching user data: ${err}`);
    });
} else {
    //No user cookie, so display login form:
    const loginForm = document.getElementById('loginForm') as HTMLFormElement;

    //Set the display mode
    loginForm.style.display = 'block';

    //Create event listener for the form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = (document.getElementById('username') as HTMLInputElement).value;
        const password = (document.getElementById('password') as HTMLInputElement).value;

        console.log(`Attempting login with username: ${username}`);
        fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                { username, password }
            )
        }).then(res => res.json()).then((data: User) => {
            console.log(`Login successful, userId: ${data.id}`);
            Cookies.set('userId', data.id, { expires: 30 });
            loggedIn = true;

            //Reload the page to update the UI
            location.reload();
        }).catch(err => {
            console.error(`Login failed: ${err}`);
        });
    });
}
