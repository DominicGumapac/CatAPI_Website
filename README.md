The README

This website is a single site page that uses the CatAPI to search images or clips from its databases.

To run this project locally you must

1. Clone the repo into your local folder

2. Create config.js file with this code inside it

const CAT_API_KEY = "Your API key from CatAPI"

This is to ensure that the my personal API Key won't be leaked or accessible to the public

Important: Even with config.js kept out of GitHub, once your site is deployed and your JavaScript calls the Pixabay API directly from the browser, anyone who opens developer tools or views the network request can see your API key. Keeping config.js out of your repository keeps the key out of your GitHub history, which is a real and worthwhile habit, but it does not hide the key from someone using your live site.
