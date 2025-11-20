# 🎮 Plinko Game

A modern, interactive Plinko game simulator built with vanilla JavaScript and Matter.js physics engine. Experience the thrill of the classic Plinko game with smooth physics, customizable settings, and an intuitive interface.

## 🎯 Features

- **Realistic Physics**: Powered by Matter.js for authentic ball dropping and bouncing mechanics
- **Customizable Gameplay**: 
  - Choose between 8, 12, or 16 rows for different difficulty levels
  - Adjustable ball size (5% - 45%)
  - Variable betting amounts
- **Auto-Play Mode**: Hold the button to automatically drop balls at speeds up to 20 balls per second
- **Multiplier System**: Land in different buckets for various multiplier payouts (up to 1000x!)
- **Sound Effects**: Dynamic audio feedback for peg hits and winning scores
- **Responsive Design**: Works seamlessly on desktop and mobile devices with touch support
- **Modern UI**: Clean, dark-themed interface built with Tailwind CSS

## 🚀 Demo

Visit the live demo: [Play Plinko Game](https://sebichin.github.io/plinko-game/)

## 🎲 How to Play

1. **Set Your Bet**: Enter the amount you want to wager (default: $100)
2. **Choose Difficulty**: Select 8, 12, or 16 rows to adjust the challenge level
3. **Adjust Settings**: 
   - Use the Auto Speed slider to control how fast balls drop in auto-play mode
   - Adjust Ball Size to change the ball diameter
4. **Drop Balls**: 
   - Click once to drop a single ball
   - Hold the button to enable auto-play mode
5. **Watch and Win**: Watch your ball bounce through the pegs and land in a multiplier bucket!

## 💰 Multipliers

Different row configurations offer unique multiplier distributions:

- **8 Rows**: 29x, 4x, 2x, 0.3x, 2x, 4x, 29x
- **12 Rows**: 170x, 24x, 8.1x, 2x, 1x, 0.5x, 1x, 2x, 8.1x, 24x, 170x
- **16 Rows**: 1000x, 26x, 9x, 4x, 2x, 0.2x, 0.2x, 0.2x, 0.2x, 0.2x, 2x, 4x, 9x, 26x, 1000x

Higher risk = higher potential rewards!

## 🛠️ Technologies Used

- **HTML5** - Structure and canvas rendering
- **CSS3** - Styling with Tailwind CSS
- **JavaScript (ES6+)** - Game logic and interactivity
- **Matter.js** - 2D physics engine for realistic ball physics
- **Web Audio API** - Dynamic sound generation

## 📦 Installation

No build process required! Simply:

1. Clone this repository:
   ```bash
   git clone https://github.com/sebichin/plinko-game.git
   ```

2. Open `index.html` in your web browser:
   ```bash
   cd plinko-game
   open index.html
   ```

Or use a local web server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server
```

Then navigate to `http://localhost:8000` in your browser.

## 🌐 Hosting on GitHub Pages

This project is configured to deploy automatically to GitHub Pages using GitHub Actions. The workflow:

1. Triggers on pushes to the `main` branch
2. Deploys the `index.html` file to GitHub Pages
3. Makes the game accessible at `https://sebichin.github.io/plinko-game/`

### Manual GitHub Pages Setup

If you want to set up GitHub Pages manually:

1. Go to your repository settings
2. Navigate to "Pages" in the sidebar
3. Under "Source", select "GitHub Actions"
4. The game will be automatically deployed on the next push

## 🎨 Customization

The game is highly customizable. Here are some areas you can modify:

### Adjust Physics
Edit the physics constants in the JavaScript:
```javascript
engine.world.gravity.y = 1.6;  // Gravity strength
engine.timing.timeScale = 0.7; // Game speed
```

### Change Multipliers
Modify the `MULTIPLIERS` object:
```javascript
const MULTIPLIERS = {
    8:  [29, 4, 2, 0.3, 2, 4, 29],
    12: [170, 24, 8.1, 2, 1, 0.5, 1, 2, 8.1, 24, 170],
    16: [1000, 26, 9, 4, 2, 0.2, 0.2, 0.2, 0.2, 0.2, 2, 4, 9, 26, 1000]
};
```

### Customize Colors
Update the color scheme in the CSS or JavaScript render options:
```javascript
render: { 
    fillStyle: '#ff0055',      // Ball color
    strokeStyle: '#ff88aa',    // Ball outline
    lineWidth: 2
}
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Matter.js](https://brm.io/matter-js/) - Excellent 2D physics engine
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- Inspired by the classic Plinko game from "The Price is Right"

## 📞 Contact

Sebastian - [@sebichin](https://github.com/sebichin)

Project Link: [https://github.com/sebichin/plinko-game](https://github.com/sebichin/plinko-game)

---

Made with ❤️ by Sebastian
