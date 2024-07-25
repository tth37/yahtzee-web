<script lang="ts" setup>
import { ref } from 'vue'
import { Room, Player, Scoreboard, Game } from './model';
import { io } from 'socket.io-client';

const URL = 'http://18.181.253.234:3001';
const socket = io(URL);

const room = ref<Room>(new Room());
const socketId = ref<string>('');
const my = ref<Player | undefined>(undefined);
const myName = ref<string>('');
const mySuggestion = ref<Scoreboard | undefined>(undefined);

const cur = ref<Player | undefined>(undefined);
const kept = ref<number[]>([]);

socket.on('connect', () => {
  console.log('Connected to server with socket id:', socket.id);
  socketId.value = socket.id!;
});

const roomId = window.location.pathname.split('/')[1] || 'default';
socket.emit('getRoom', roomId);


socket.on('updateRoom', (roomData: Room) => {
  Object.assign(room.value, roomData);
  my.value = room.value.myPlayer(socketId.value);
  cur.value = room.value.game.sequence[0];
  mySuggestion.value = room.value.game.suggestions.find(s => s.player.socketId === my.value?.socketId);
  kept.value = room.value.game.kept;
  console.log('MySuggestions:', mySuggestion.value);
  console.log('Current player:', cur.value);
});

</script>

<template>
    <div class="ui grid container">
      <!-- Left column: Room info -->
      <div class="five wide column">
        <div class="ui segment">
          <h2 class="ui header">Room Info</h2>
          <p>Room ID: {{ roomId }}</p>
          <div v-if="my">
            <h3 class="ui header">Your Info</h3>
            <p>Name: {{ my.name }}</p>
            <p>Role: {{ my.role }}</p>
            <div v-if="!room.active">
            <button class="ui primary button" @click="socket.emit('switchRole', roomId)">Switch to {{ my.role === 'player' ? 'spectator' : 'player' }}</button>
            <button v-if="my.role === 'player'" class="ui red button" @click="socket.emit('ready', roomId)">{{ my.readiness ? 'Unready' : 'Ready' }}</button>
            </div>
          </div>
          <div v-else>
            <h3 class="ui header">Join Room</h3>
            <div class="ui form">
              <div class="field">
                <label>Name</label>
                <input type="text" v-model="myName" placeholder="Your Name">
              </div>
              <button class="ui primary button" @click="socket.emit('joinRoom', roomId, myName )">Join</button>
            </div>
          </div>
          <h3 class="ui header">Players</h3>
          <ul class="ui list">
            <li v-for="player in room.players.filter(p => p.role === 'player')" :key="player.socketId">{{ player.name }}{{ player.readiness ? ' (ready)' : '' }}</li>
          </ul>
          <h3 class="ui header">Spectators</h3>
          <ul class="ui list">
            <li v-for="spectator in room.players.filter(p => p.role === 'spectator')" :key="spectator.socketId">{{ spectator.name }}</li>
          </ul>
          <h3 class="ui header">Messages</h3>
          <div class="ui comments">
            <div class="comment" v-for="(message, index) in room.messages" :key="index">
              <div class="content">
                <div class="text">{{ message }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
  
      <!-- Center column: Dice status -->
      <div class="six wide column">
        <div class="ui segment">
          <h2 class="ui header">Current Dice</h2>
          <div class="ui five column grid">
            <div class="column" v-for="(die, index) in room.game.dice" :key="index">
              <button v-if="!kept.includes(index)" @click="socket.emit('keep', roomId, index)" class="ui circular button">{{ die }}</button>
              <button v-else @click="socket.emit('keep', roomId, index)" class="ui circular primary button">{{ die }}</button>
            </div>
            <!-- 5 dices, binded with "kept". if selected, kept.insert(idx) -->
          </div>
          <p>Rolls left: {{ room.game.rollsLeft }}</p>
          <p>Current player: {{ cur? cur.name : '' }}</p>
          <button class="ui primary button" :disabled="cur === my" @click="socket.emit('reroll', roomId, kept)">Roll</button>
        </div>
      </div>
  
      <!-- Right column: Scoreboards -->
      <div class="five wide column">
        <div class="ui segment">
          <h2 class="ui header">Scoreboards</h2>
          <table class="ui celled table">
            <thead>
              <tr>
                <th>Category</th>
                <th v-for="scoreboard in room.game.scoreboards">{{ scoreboard.player.name }}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Ones</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.ones === null" style="color: red;" @click="socket.emit('score', roomId, 'ones')">
                      {{ mySuggestion!.ones }}
                    </span>
                    <span v-else>{{ scoreboard.ones }}</span>
                  </span>
                  <span v-else>{{ scoreboard.ones }}</span>
                </td>
              </tr>
              <tr>
                <td>Twos</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.twos === null" style="color: red;" @click="socket.emit('score', roomId, 'twos')">
                      {{ mySuggestion!.twos }}
                    </span>
                    <span v-else>{{ scoreboard.twos }}</span>
                  </span>
                  <span v-else>{{ scoreboard.twos }}</span>
                </td>
              </tr>
              <tr>
                <td>Threes</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.threes === null" style="color: red;" @click="socket.emit('score', roomId, 'threes')">
                      {{ mySuggestion!.threes }}
                    </span>
                    <span v-else>{{ scoreboard.threes }}</span>
                  </span>
                  <span v-else>{{ scoreboard.threes }}</span>
                </td>
              </tr>
              <tr>
                <td>Fours</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.fours === null" style="color: red;" @click="socket.emit('score', roomId, 'fours')">
                      {{ mySuggestion!.fours }}
                    </span>
                    <span v-else>{{ scoreboard.fours }}</span>
                  </span>
                  <span v-else>{{ scoreboard.fours }}</span>
                </td>
              </tr>
              <tr>
                <td>Fives</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.fives === null" style="color: red;" @click="socket.emit('score', roomId, 'fives')">
                      {{ mySuggestion!.fives }}
                    </span>
                    <span v-else>{{ scoreboard.fives }}</span>
                  </span>
                  <span v-else>{{ scoreboard.fives }}</span>
                </td>
              </tr>
              <tr>
                <td>Sixes</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.sixes === null" style="color: red;" @click="socket.emit('score', roomId, 'sixes')">
                      {{ mySuggestion!.sixes }}
                    </span>
                    <span v-else>{{ scoreboard.sixes }}</span>
                  </span>
                  <span v-else>{{ scoreboard.sixes }}</span>
                </td>
              </tr>
              <tr>
                <td>Bonus</td>
                <td v-for="scoreboard in room.game.scoreboards">{{ scoreboard.bonus }}</td>
              </tr>
              <tr>
                <td>Three of a Kind</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.threeOfAKind === null" style="color: red;" @click="socket.emit('score', roomId, 'threeOfAKind')">
                      {{ mySuggestion!.threeOfAKind }}
                    </span>
                    <span v-else>{{ scoreboard.threeOfAKind }}</span>
                  </span>
                  <span v-else>{{ scoreboard.threeOfAKind }}</span>
                </td>
              </tr>
              <tr>
                <td>Four of a Kind</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.fourOfAKind === null" style="color: red;" @click="socket.emit('score', roomId, 'fourOfAKind')">
                      {{ mySuggestion!.fourOfAKind }}
                    </span>
                    <span v-else>{{ scoreboard.fourOfAKind }}</span>
                  </span>
                  <span v-else>{{ scoreboard.fourOfAKind }}</span>
                </td>
              </tr>
              <tr>
                <td>Full House</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.fullHouse === null" style="color: red;" @click="socket.emit('score', roomId, 'fullHouse')">
                      {{ mySuggestion!.fullHouse }}
                    </span>
                    <span v-else>{{ scoreboard.fullHouse }}</span>
                  </span>
                  <span v-else>{{ scoreboard.fullHouse }}</span>
                </td>
              </tr>
              <tr>
                <td>Small Straight</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.smallStraight === null" style="color: red;" @click="socket.emit('score', roomId, 'smallStraight')">
                      {{ mySuggestion!.smallStraight }}
                    </span>
                    <span v-else>{{ scoreboard.smallStraight }}</span>
                  </span>
                  <span v-else>{{ scoreboard.smallStraight }}</span>
                </td>
              </tr>
              <tr>
                <td>Large Straight</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.largeStraight === null" style="color: red;" @click="socket.emit('score', roomId, 'largeStraight')">
                      {{ mySuggestion!.largeStraight }}
                    </span>
                    <span v-else>{{ scoreboard.largeStraight }}</span>
                  </span>
                  <span v-else>{{ scoreboard.largeStraight }}</span>
                </td>
              </tr>
              <tr>
                <td>Chance</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.chance === null" style="color: red;" @click="socket.emit('score', roomId, 'chance')">
                      {{ mySuggestion!.chance }}
                    </span>
                    <span v-else>{{ scoreboard.chance }}</span>
                  </span>
                  <span v-else>{{ scoreboard.chance }}</span>
                </td>
              </tr>
              <tr>
                <td>Yahtzee</td>
                <td v-for="scoreboard in room.game.scoreboards">
                  <span v-if="scoreboard.player.socketId === my?.socketId">
                    <span v-if="scoreboard.yahtzee === null" style="color: red;" @click="socket.emit('score', roomId, 'yahtzee')">
                      {{ mySuggestion!.yahtzee }}
                    </span>
                    <span v-else>{{ scoreboard.yahtzee }}</span>
                  </span>
                  <span v-else>{{ scoreboard.yahtzee }}</span>
                </td>
              </tr>
              <tr>
                <td>Total</td>
                <td v-for="scoreboard in room.game.scoreboards">{{ scoreboard.total }}</td>
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  </template>