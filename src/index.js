/* global document, window */
import { Player, getClip } from './player';
import getTime from './time';

const player = new Player();
let muted = false;

function pluralize(s, amt) {
  let ret = (s);
  if (amt !== 1) {
    ret += 's';
  }

  return ret;
}

function getStation() {
  return document.getElementById('station').value;
}

let nextText = '';
function runningClock() {
  const clock = document.getElementById('clock');
  clock.innerHTML = nextText;

  const now = getTime();
  const delay = 1000 - now.getUTCMilliseconds();
  now.setUTCSeconds(now.getUTCSeconds() + 1);
  nextText = now.toISOString().substring(11, 19);
  setTimeout(runningClock, delay);
}

function realtime() {
  if (muted) {
    return;
  }

  const now = getTime();
  let hours = now.getUTCHours();
  let minutes = now.getUTCMinutes();
  const secs = now.getUTCSeconds();
  const ms = 1000 * now.getUTCSeconds() + now.getUTCMilliseconds();
  const station = getStation();
  let clip;

  if (minutes === 59) {
    player.playAt('hour_pulse', 0);
  } else {
    player.playAt(`${station}_minute_pulse`, 0);
  }

  // pick correct tone file
  if ((minutes + 1) % 2 === 0) {
    clip = '_main_500';
  } else {
    clip = '_main_600';
  }

  if (((minutes === 0 || minutes === 30) && station === 'v')
        || ((minutes === 29 || minutes === 59) && station === 'h')) {
    clip = '_ident';
  }

  if ((minutes === 1 && station === 'h') || (minutes === 2 && station === 'v')) {
    clip = '_main_440';
  }

  clip = station + clip;
  const clipDuration = getClip(clip).duration;

  if (secs >= 1 && secs < clipDuration) {
    const offset = ms - 1000;
    player.playAt(clip, ms + 50, offset);
  } else {
    player.playAt(clip, 1000);
  }

  // Pulses and voice time
  if (secs > clipDuration - 1 && secs !== 58) {
    player.playAt(`${station}_pulse`, ((secs + 1) * 1000) % 60000);
  }

  player.playAt(`${station}_at_the_tone2`, (station === 'h') ? 45500 : 52500);

  // Play voice time announcing
  minutes += 1;
  if (minutes > 59) {
    minutes = 0;
    hours += 1;
  }
  if (hours > 23) {
    hours = 0;
  }

  let vtStart = (station === 'h') ? 46500 : 53500;

  clip = player.playAt(`${station}_${hours}`, vtStart, 0, 'vt1');

  vtStart += clip.duration * 1000;
  clip = player.playAt(`${station}_${pluralize('hour', hours)}`, vtStart, 0, 'vt2');

  vtStart += clip.duration * 1000 + 100;
  clip = player.playAt(`${station}_${minutes}`, vtStart, 0, 'vt3');

  vtStart += clip.duration * 1000 + 100;
  clip = player.playAt(`${station}_${pluralize('minute', minutes)}`, vtStart, 0, 'vt4');

  // "coordinated universal time"
  player.playAt(`${station}_utc2`, (station === 'h') ? 49750 : 56750);

  setTimeout(realtime, 200);
}

// function stop() {
//    stopPlaying = true;
//    document.getElementById("go").disabled = false;
// }
//
// function go() {
//    realtime();
//    document.getElementById("go").disabled = true;
// }

function setStation() {
  const stationClass = (getStation() === 'h') ? 'wwvh' : 'wwv';
  document.getElementById('body').className = `background ${stationClass}`;
}

function audioToggle() {
  muted = !muted;
  const el = document.getElementById('audio');
  el.src = muted ? 'unmute.svg' : 'mute.svg';

  if (muted) {
    player.stop();
  } else {
    player.start();
    realtime();
  }
}

audioToggle();
setStation();
runningClock();
realtime();
window.audioToggle = audioToggle;