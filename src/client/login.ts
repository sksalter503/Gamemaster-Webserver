//Create a form for loggin in, which then changes to a logout button if the user is currently logged in.
import Cookies from 'js-cookie';
import { API_URL } from '../shared/consts';
import { User } from '../shared/user';

let loggedIn = false;
let userId = Cookies.get('userId');

export let userPromise: Promise<User | null> = (async () => {
    if (userId) {
        const res = await fetch(`${API_URL}/user/${userId}`);
        if (!res.ok) {
            console.error(`Failed to fetch user data for userId: ${userId}`);
            return null;
        }
        const data: User = await res.json();
        console.log(`User cookie found, userId: ${userId}`);
        console.log(`User data: ${JSON.stringify(data)}`);
        loggedIn = true;

        //Hide the login form and display the logout button:
        const loginForm = document.getElementById('loginForm') as HTMLFormElement;
        loginForm.style.display = 'none';

        const logoutButton = document.getElementById('logoutButton') as HTMLButtonElement;
        logoutButton.style.display = 'block';
        logoutButton.addEventListener('click', () => {
            Cookies.remove('userId');
            loggedIn = false;
            location.reload();
        });

        return data;
    } else {
        //No user cookie, so display login form:
        const loginForm = document.getElementById('loginForm') as HTMLFormElement;
        console.log(`loginForm: ${loginForm}`);

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

        return null;
    }
})();
