// ==UserScript==
// @name         Game Stats
// @namespace    p1
// @run-at       document-start
// @version      0.4
// @updateURL    https://github.com/p1-BCMC/GameStats/raw/master/GameStats.user.js
// @downloadURL  https://github.com/p1-BCMC/GameStats/raw/master/GameStats.user.js
// @description  Generates some useful stats in the right top corner of the game, showing Frames per Second (FPS), Ping to the server (PING), Critters in current Room (CIR), and Total Amount of Critters online (ON)!
// @author       p1
// @match        https://boxcritters.com/play/
// @match        https://boxcritters.com/play/?*
// @match        https://boxcritters.com/play/#*
// @match        https://boxcritters.com/play/index.html
// @match        https://boxcritters.com/play/index.html?*
// @match        https://boxcritters.com/play/index.html#*
// @grant        none
// @require      https://github.com/SArpnt/joinFunction/raw/master/script.js
// ==/UserScript==

(function() {
    'use strict';

    let timer = setInterval(function() {
		if (typeof world !== "undefined" && typeof world.stage !== "undefined" && typeof world.stage.room !== "undefined") {
			clearInterval(timer);
			onWorldLoaded();
		}
	}, 1000/60);

	function onWorldLoaded() {
		let playerIsAFK = false;
		let timeOfLastAction = performance.now();
		let timeOfLastPing = performance.now();
		let pingTime = 0;
		let globalPlayerCount = 0;
		let roomPlayerCount = 0;
		let currentFPS = 0;
		let heroVisible = true;
		let gameStatsAreShiftedLeft = false;
		let defaultShiftAmount = 105;

		/* We override the "pop" event, as it’s not gonna be used anymore anyways */
		world._events.pop[0] = function(playerCount) {
			globalPlayerCount = playerCount;
			pingTime = Math.round(performance.now() - timeOfLastPing);
			setNewGameStatsValues("Pop", globalPlayerCount);
			setNewGameStatsValues("Ping", pingTime);
		};

		function checkGlobalPlayerCountWorker() {
			socket.emit("pop");
			let currentTime = performance.now();
			timeOfLastPing = performance.now();
			if (currentTime - timeOfLastAction > 300000) {
				/* The player has been afk for longer than 5 minutes, we reduce the interval of updating the global player count… */
				/* Updates every 60 seconds */
				if (playerIsAFK == false) {
					console.log("You have been AFK for more than 5 minutes. Reducing gameStats update interval…");
					playerIsAFK = true;
				}
				setTimeout(function() {checkGlobalPlayerCountWorker()}, 60000);
			} else {
				if (playerIsAFK == true) {
					console.log("Welcome back. Increasing gameStats update interval back to normal…");
					playerIsAFK = false;
				};
				/* Updates every 15 seconds */
				setTimeout(function() {checkGlobalPlayerCountWorker()}, 15000);
			};
		};
		checkGlobalPlayerCountWorker();

		function updateTimeOfLastAction() {
			timeOfLastAction = performance.now();
		};

		world.stage.hero.children[0].children[0].name = "Coins";

		let gameStatsCardObject = new box.Card(80, 60);
		gameStatsCardObject.setTransform(world.stage.width - defaultShiftAmount, 5);
		gameStatsCardObject.name = "gameStats";
		let gameStatsBackgroundImage = new createjs.Bitmap("https://raw.githubusercontent.com/p1-BCMC/GameStats/master/StatsContainer.png");
		gameStatsBackgroundImage.setTransform(0, 0, 0.3, 0.3);

		let staticFPSText = new box.Text("FPS:", {
			fontName: "Luckiest Guy", fontSize: 10, fontColor: "#FFC636", outline: 2
		});
		staticFPSText.setTransform(6, 13);
		staticFPSText.name="Static FPS Text";

		let dynamicFPSNumber = new box.Text("60", {
			fontName: "Luckiest Guy", fontSize: 12, fontColor: "#FFC636", outline: 2.4
		});
		dynamicFPSNumber.setTransform(26, 12);
		dynamicFPSNumber.name="FPS";

		let staticPingText = new box.Text("Ping:", {
			fontName: "Luckiest Guy", fontSize: 10, fontColor: "#FFC636", outline: 2
		});
		staticPingText.setTransform(43, 13);
		staticPingText.name="Static Ping Text";

		let dynamicPingNumber = new box.Text("00", {
			fontName: "Luckiest Guy", fontSize: 12, fontColor: "#FFC636", outline: 2.4
		});
		dynamicPingNumber.setTransform(69, 12);
		dynamicPingNumber.name="Ping";

		let staticHereText = new box.Text("CIR:", {
			fontName: "Luckiest Guy", fontSize: 10, fontColor: "#FFC636", outline: 2
		});
		staticHereText.setTransform(6, 27);
		staticHereText.name="Static Here Text";

		let dynamicHereNumber = new box.Text(world.room.playerCrumbs.length, {
			fontName: "Luckiest Guy", fontSize: 12, fontColor: "#FFC636", outline: 2.4
		});
		dynamicHereNumber.setTransform(24, 26);
		dynamicHereNumber.name="Here";

		let staticPopText = new box.Text("On:", {
			fontName: "Luckiest Guy", fontSize: 10, fontColor: "#FFC636", outline: 2
		});
		staticPopText.setTransform(48, 27);
		staticPopText.name="Static Pop Text";

		let dynamicPopNumber = new box.Text("000", {
			fontName: "Luckiest Guy", fontSize: 12, fontColor: "#FFC636", outline: 2.4
		});
		dynamicPopNumber.setTransform(65, 26);
		dynamicPopNumber.name="Pop";

		gameStatsCardObject.addChild(gameStatsBackgroundImage);
		gameStatsCardObject.addChild(staticFPSText);
		gameStatsCardObject.addChild(dynamicFPSNumber);
		gameStatsCardObject.addChild(staticPingText);
		gameStatsCardObject.addChild(dynamicPingNumber);
		gameStatsCardObject.addChild(staticHereText);
		gameStatsCardObject.addChild(dynamicHereNumber);
		gameStatsCardObject.addChild(staticPopText);
		gameStatsCardObject.addChild(dynamicPopNumber);

		world.stage.hero.children[0].addChild(gameStatsCardObject);

		let gameStatsOverlayObject = new box.Card(80, 60);
		gameStatsOverlayObject.setTransform(world.stage.width - defaultShiftAmount, 5);
		gameStatsOverlayObject.name = "gameStatsOverlay";
		let gameStatsOverlayGraphicSettings = new createjs.Graphics();
		gameStatsOverlayGraphicSettings.beginFill("#000000");
		gameStatsOverlayGraphicSettings.drawRoundRect(0, 3, 95, 40, 14);
		let gameStatsOverlayGraphic = new createjs.Shape(gameStatsOverlayGraphicSettings);
		gameStatsOverlayObject.addChild(gameStatsOverlayGraphic);
		gameStatsOverlayObject.on("click",(function(){}));
		gameStatsOverlayObject.alpha = 0.01;
		world.stage.hero.children[0].addChild(gameStatsOverlayObject);


		function setNewGameStatsValues(statName, value) {
			let numberContainer = world.stage.hero.children[0].getChildByName("gameStats").getChildByName(statName);
			numberContainer.children[0].text = value;
			numberContainer.children[1].text = value;
		}

		function hideShowHero() {
			if (heroVisible == true) {
				world.stage.hero.alpha = 0.1;
				gameStatsOverlayObject.alpha = 0.1;
				heroVisible = false;
			} else {
				world.stage.hero.alpha = 1;
				gameStatsOverlayObject.alpha = 0.01;
				heroVisible = true;
			};
		};

		world.stage.hero.children[0].getChildByName("Coins").on("click", function() {
			hideShowHero();
		});

		/* As the custom image is an external resource, it can’t do click checks for it - that’s why we have this separate shape. */
		world.stage.hero.children[0].getChildByName("gameStatsOverlay").on("click", function() {
			hideShowHero();
		});

		sendMessage = joinFunction(sendMessage, updateTimeOfLastAction);

		function shiftGameStatsLeft() {
			let newShiftAmount = world.stage.side.children[world.stage.side.numChildren - 1].width * world.stage.side.children[world.stage.side.numChildren - 1].scale + defaultShiftAmount;
			world.stage.hero.children[0].getChildByName("gameStats").setTransform(world.stage.width - newShiftAmount, 5);
			world.stage.hero.children[0].getChildByName("gameStatsOverlay").setTransform(world.stage.width - newShiftAmount, 5);

			world.stage.side.children[0].children.forEach(child => {
				if (child._listeners != undefined) {
					if (child.children[0].image != undefined) {
						if (child.children[0].image.currentSrc == "https://boxcritters.com/images/buttons/close.png") {
							child._listeners.click[0] = joinFunction(shiftGameStatsBack, child._listeners.click[0]);
						};
					};
				};
			});

			updateTimeOfLastAction();
		};

		function shiftGameStatsBack() {
			world.stage.hero.children[0].getChildByName("gameStats").setTransform(world.stage.width - defaultShiftAmount, 5);
			world.stage.hero.children[0].getChildByName("gameStatsOverlay").setTransform(world.stage.width - defaultShiftAmount, 5);
			updateTimeOfLastAction();
		};

		world.showShop = joinFunction(world.showShop, shiftGameStatsLeft);
		world.showChat = joinFunction(world.showChat, shiftGameStatsLeft);

		world.on("joinRoom", function() {

			world.stage.hero.children[0].children[0].name = "Coins";

			/* Re-adding the children... */
			world.stage.hero.children[0].addChild(gameStatsCardObject);
			world.stage.hero.children[0].addChild(gameStatsOverlayObject);

			/* And adding the click listener again to the coins... */
			world.stage.hero.children[0].getChildByName("Coins").on("click", function() {
				hideShowHero();
			});

			/* We only readd it; the listener is still there!
			world.stage.hero.children[0].getChildByName("gameStatsOverlay").on("click", function() {
				hideShowHero();
			});
			*/

			updateTimeOfLastAction();
			roomPlayerCount = world.room.playerCrumbs.length;
			setNewGameStatsValues("Here", roomPlayerCount);
		});

		world.on("A", function(joinEvent) {
			roomPlayerCount = world.room.playerCrumbs.length;
			setNewGameStatsValues("Here", roomPlayerCount);
		});

		world.on("R", function(leaveEvent) {
			roomPlayerCount = world.room.playerCrumbs.length;
			setNewGameStatsValues("Here", roomPlayerCount);
		});

		world.on("X", function(moveEvent) {
			if (moveEvent.i == world.player.playerId) {
				updateTimeOfLastAction();
			};
		});

		/* Credits to TumbleGamer for the following code, https://github.com/boxcrittersmods/fps/blob/master/fps.user.js */
		function getTime() {
			return performance.now()/1000
		};

		let last = getTime();
		let now,dt,fps;
		now = dt = fps = 0;
		let lastFPS = [];
		let buffer = 10;
		let roundBy = 1;

		function updateFPS() {
			now = getTime();
			dt = now-last;
			fps = 1/dt;
			last = now;
		};

		createjs.Ticker.on("tick", function() {
			updateFPS();
			lastFPS.unshift(fps);
			if (lastFPS.length>buffer) {
				lastFPS.length = buffer;
			};
			var averageFPS = lastFPS.reduce((a, b) => a + b, 0) / lastFPS.length;
			setNewGameStatsValues("FPS", Math.round(averageFPS/roundBy)*roundBy);
		});
	}
})();
