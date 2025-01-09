# Tennis Match Manager

Tennis Match Manager is a web application designed to help you organize and manage tennis matches efficiently.

## Features

- **Player Selection**: Easily select players for matches from a predefined list or add new players.
- **Match Creation**: Automatically generate matches based on selected players, ensuring balanced teams.
- **Fairness Tracking**: Implemented a system to ensure fairness in match creation by tracking player participation and pairings. This system aims to balance player involvement across matches.
- **Clear Tracking Data**: A new feature that allows users to clear match fairness tracking data. This action resets all match history, providing a fresh start for tracking future matches.
- **Session Management**: Start new sessions to reset player selections and match history.

## Getting Started

To get started with Tennis Match Manager, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo/tennis-match-manager.git

## Installation

Tennis Match Manager is a Progressive Web App (PWA), which means you can install it on your Android or iOS device for
quick and easy access. Here's how:

### Android

1. Open the Tennis Match Manager in your Chrome browser.
2. Tap the menu icon (three dots) in the top right corner of the browser.
3. Tap "Add to Home screen."
4. You'll be prompted to name the shortcut before tapping the "Add" button.
5. The app icon will now appear on your home screen, and you can use it like any other app.

### iOS

1. Open the Tennis Match Manager in your Safari browser.
2. Tap the share icon (the square with an arrow pointing out) at the bottom of the screen.
3. Scroll down and tap "Add to Home Screen."
4. You'll be prompted to name the shortcut before tapping the "Add" button.
5. The app icon will now appear on your home screen, and you can use it like any other app.

## Usage

After installing the Tennis Match Manager on your device, simply tap the icon to launch the application. From there, you
can start selecting players, creating matches, and managing your tennis sessions with ease. The intuitive interface
makes it simple to navigate through the features, ensuring a smooth and efficient experience for organizing your tennis
matches.

## Dynamic Player List Configuration

The application supports dynamically loading a list of predefined players from an external URL. This feature is
particularly useful for initializing the application with a custom set of players without hardcoding them into the
application or revealing sensitive information.

### Using URL Parameters

To use this feature, you can provide the following URL parameters when accessing your application:

- `players_url`: Specifies the URL from which to fetch the list of players. Each player should be listed on a new line.
- `overwrite_players`: A boolean value (`true` or `false`) that determines whether the fetched list of players should
  overwrite any existing list stored in the application's local storage.
  Example usage:
  http://yourapplication.com/?players_url=https://example.com/path/to/players.txt&overwrite_players=true

### CORS Consideration

Fetching from an external URL may lead to CORS policy issues. If the server doesn't include CORS headers, consider using
a CORS proxy or configuring the server to include these headers. For development, a CORS proxy
like `https://corsproxy.io/` can be used by prepending it to the `players_url`.
**Important:** Ensure secure data handling, especially when using third-party CORS proxies. Prefer HTTPS to protect data
in transit.

#### Example with a CORS Proxy

To use a CORS proxy (for example https://corsproxy.io/), prepend the proxy's URL to your `players_url` parameter:
http://yourapplication.com/?players_url=https://corsproxy.io/?https%3A%2F%2Fpastebin.com%2Fraw%2FTNfcHCVUA2&overwrite_players=true

**Important:** Be mindful of the security and privacy implications when using a third-party CORS proxy. Ensure that the
proxy is reliable and does not log or misuse the data passing through it.
