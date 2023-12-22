//var Color = importNamespace('PixelCombats.ScriptingApi.Structures');
//var System = importNamespace('System');

let blockEnum = [
	//Красные
	"Red",
	//Синие
	"Blue",
	//Все в том числе багованные
	"All",
	//Все не багованные
	"AllClear",
	//Пусто
	"NullSet"
];

function restart() {
	Game.RestartGame();
};

function win() {
	var spawns = Spawns.GetContext();
	spawns.enable = false;
	spawns.Despawn();
	Game.GameOver(LeaderBoard.GetTeams());
};

function spawnAll() {
	var e = Teams.GetEnumerator();
	while (e.moveNext()) {
		Spawns.GetContext(e.Current).Spawn();
	}
};

function setMode(mode) {
	if (!data.timers[mode]) return;
	
	stateProp.Value = mode;
	Ui.GetContext().Hint.Value = data.timers[mode][2];
	Spawns.GetContext().enable = data.timers[mode][1];
	mainTimer.Restart(data.timers[mode][0]);

	data.timerFunctions[mode][0]();
};

/*Пример одного таймера*/
//"waiting": [8, true, "Ожидание игроков"]

/*Пример одной тимы*/
//"blue": { name: "Синие", color: {b: 1}, block: "blue", spawn: 1, state: "Deaths" }

let data = {
	timers: {
		waiting: [8, true, "Ожидание игроков"],
		build: [30, true, "Разминка"],
		play: [300, true, "Игра началась"],
		end: [4, true, "Конец матча"],
	},

	timerFunctions: {
		//Можно добавить не только функцию изменения инвентаря, но и другие, для каждого по таймеру
		waiting: [function() {
			spawnAll();
			
			let inventory = Inventory.GetContext();
			inventory.Main.Value = false;
			inventory.Secondary.Value = false;
			inventory.Melee.Value = false;
			inventory.Explosive.Value = false;
			inventory.Build.Value = false;
		}],
		build: [function() {
			let inventory = Inventory.GetContext();
			inventory.Main.Value = false;
			inventory.Secondary.Value = false;
			inventory.Melee.Value = true;
			inventory.Explosive.Value = false;
			inventory.Build.Value = true;
		}],
		play: [function() {
			let inventory = Inventory.GetContext();
			inventory.Main.Value = true;
			inventory.Secondary.Value = true;
			inventory.Melee.Value = true;
			inventory.Explosive.Value = true;
			inventory.Build.Value = true;
		}],
		end: [function() {
			win();
		}],
	},
	
	roomTeams: {
		//Команды в комнате
		"blue": {
			name: "Синие",
			color: {b: 1},
			block: "blue",
			spawn: 1,
			state: "Kills"
		},
		"red": {
			name: "Красные",
			color: {r: 1},
			block: "red",
			spawn: 2,
			state: "Kills"
		}
	}
};

for (const team in data.roomTeams) {
	let item = data.roomTeams[team];
	Teams.Add(team, item.name, item.color);
	Teams.get(team).Spawn.SpawnPointsGroups.Add(item.spawn);
	switch (item.block) {
		case "red":
			Teams.get(team).Build.BlocksSet.Value = BuildBlocksSet.Red;
			break
		case "blue":
			Teams.get(team).Build.BlocksSet.Value = BuildBlocksSet.Blue;
			break
		case "Null":
			Teams.get(team).Build.BlocksSet.Value = BuildBlocksSet.NullSet;
			break
	};
};

//Правила
let gamerules = {
	Damage: {
		DamageIn: true,
		DamageOut: false,
		
		FriendlyFire: false,
		GranadeTouchExplosion: false
	},
	
	Map: {
		Rotation: false
	},
	
	BreackGraph: {
		OnlyPlayerBlocksDmg: true,
		PlayerBlockDmg: false,
			
		WeakBlocks: false,
		PlayerBlockBoost: false,

		Damage: true,
		BreakAll: false
	},
	
	TeamsBalancer: {
		IsAutoBalance: true,
		MaxPlayerDifference: 1
	},
	
	Build: {
		CollapseChangeEnable: false
	}
};

//Просматривать правила
for (const gamerule in gamerules) {
	//Просматривать значения правил
	for (const rule in gamerules[gamerule]) {
		//Выставлять для каждого правила свои значения из правил
		let value = gamerules[gamerule][rule];
		switch (gamerule) {
			case "Damage":
				Damage[rule] = value
				break
			case "Map":
				Map[rule] = value
				break
			case "BreackGraph":
				BreackGraph[rule] = value
				break
			case "TeamsBalancer":
				TeamsBalancer[rule] = value
				break
			case "Build":
				Build.getContext()[rule] = value;
				break
		};
	};
};

//Запускать каждый таймер поочерёдно
let timersCount = 0;
for (const a in data.timers) { timersCount++; };
let count = 0;
let timerCount = 0;
mainTimer.OnTimer.Add(function() {
	let value = state.Value;
	if (timerCount >= timersCount) {
		restart()
		return
	};
	
	for (const state in data.timers) {
		let dat = data.timers[state];
		if (value === state) {
			timerCount++;
			if (count > 0) {
				setMode(state);
			} else {
				count++;
			};
		};
	};
});

//Название режима в вкладке MAPS
Properties.GetContext().GameModeName.Value = "Продвинутый режим TDM";

//Переменные комнаты
/*Таймер*/ let timer = Timers.GetContext().Get("Main");
/*Интерфейс команд*/ let state = Properties.GetContext().Get("State");
/*Игроков в комнате*/ Players.MaxCount;

//Другое
Ui.GetContext().MainTimerId.Value = mainTimer.Id;
//------

//Изменяемые
let maxTeamStateCount = 14;
let invulnerablePlayerTime = 3;

//Не советую изменять
let immortalityTimerName = "immortality";

Teams.Get("Red").Properties.Get("Deaths").Value = maxDeaths;
Teams.Get("Blue").Properties.Get("Deaths").Value = maxDeaths;

LeaderBoard.PlayerLeaderBoardValues = [
	{Value: "Kills", DisplayName: "Statistics/Kills", ShortDisplayName: "Statistics/KillsShort"},
	{Value: "Deaths", DisplayName: "Statistics/Deaths", ShortDisplayName: "Statistics/DeathsShort"},
	{Value: "Spawns", DisplayName: "Statistics/Spawns", ShortDisplayName: "Statistics/SpawnsShort"}, 
	{Value: "Scores", DisplayName: "Statistics/Scores", ShortDisplayName: "Statistics/ScoresShort"}
];
LeaderBoard.TeamLeaderBoardValue = {Value: "Deaths", DisplayName: "Statistics\Deaths", ShortDisplayName: "Statistics\Deaths"};

LeaderBoard.TeamWeightGetter.Set(function(team) {return team.Properties.Get("Deaths").Value;});
LeaderBoard.PlayersWeightGetter.Set(function(player) {return player.Properties.Get("Kills").Value;});
Teams.OnRequestJoinTeam.Add(function(player,team){team.Add(player);});
Teams.OnPlayerChangeTeam.Add(function(player){player.Spawns.Spawn();});

Spawns.GetContext().OnSpawn.Add(function(player){player.Properties.Immortality.Value=true;timer=player.Timers.Get(immortalityTimerName).Restart(invulnerablePlayerTime);});
Timers.OnPlayerTimer.Add(function(timer){if(timer.Id!=immortalityTimerName) return;timer.Player.Properties.Immortality.Value=false;});

Properties.OnPlayerProperty.Add(function(context, value) {if (value.Name !== "Deaths") return;if (context.Player.Team == null) return;context.Player.Team.Properties.Get("Deaths").Value++;});

Properties.OnTeamProperty.Add(function(context, value) {
	if (value.Name !== "Kills") return;
	if (value.Value >= maxTeamStateCount) {
		setMode("end");
	};
});

Spawns.OnSpawn.Add(function(player) {++player.Properties.Spawns.Value;});
Damage.OnDeath.Add(function(player) {++player.Properties.Deaths.Value;});

Damage.OnKill.Add(function(player, killed) {if (killed.Team != null && killed.Team != player.Team) {++player.Properties.Kills.Value;player.Properties.Scores.Value += Math.floor((Math.random() * 1100) - 100);}});

//Устaновка режима по дефолту, ожидание
setMode("waiting");
