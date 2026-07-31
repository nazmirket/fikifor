export type GameSound = 'join' | 'win'

const sources: Record<GameSound, string> = {
	join: '/sounds/join.m4a',
	win: '/sounds/win.m4a',
}

type AudioWindow = Window & {
	AudioContext?: typeof AudioContext
	webkitAudioContext?: typeof AudioContext
}

let context: AudioContext | undefined
let prepared = false
let unlockInstalled = false
const buffers = new Map<GameSound, Promise<AudioBuffer>>()
const fallback = new Map<GameSound, HTMLAudioElement>()

function audioContextConstructor() {
	if (typeof window === 'undefined') return
	const audioWindow = window as AudioWindow
	return audioWindow.AudioContext ?? audioWindow.webkitAudioContext
}

export function prepareGameAudio() {
	if (prepared || typeof window === 'undefined') return
	prepared = true

	const AudioContextConstructor = audioContextConstructor()
	if (!AudioContextConstructor) return

	context = new AudioContextConstructor()
	for (const [sound, source] of Object.entries(sources) as [GameSound, string][]) {
		buffers.set(
			sound,
			window
				.fetch(source, { cache: 'force-cache' })
				.then(response => {
					if (!response.ok)
						throw new Error(`Sound request failed with ${response.status}`)
					return response.arrayBuffer()
				})
				.then(bytes => context!.decodeAudioData(bytes)),
		)
	}
}

export async function unlockGameAudio() {
	prepareGameAudio()
	if (!context) return false

	try {
		if (context.state !== 'running') await context.resume()
		return context.state === 'running'
	} catch {
		return false
	}
}

async function playFallback(sound: GameSound) {
	if (typeof Audio === 'undefined') return false
	let audio = fallback.get(sound)
	if (!audio) {
		audio = new Audio(sources[sound])
		audio.preload = 'auto'
		fallback.set(sound, audio)
	}

	try {
		audio.pause()
		audio.currentTime = 0
		await audio.play()
		return true
	} catch {
		return false
	}
}

export async function playGameSound(sound: GameSound) {
	prepareGameAudio()

	try {
		if (context) {
			if (context.state !== 'running') await context.resume()
			const buffer = await buffers.get(sound)
			if (buffer && context.state === 'running') {
				const source = context.createBufferSource()
				source.buffer = buffer
				source.connect(context.destination)
				source.start()
				return true
			}
		}
	} catch {
		// The HTML audio fallback below covers unavailable codecs and blocked contexts.
	}

	return playFallback(sound)
}

export function installGameAudioUnlock() {
	prepareGameAudio()
	if (unlockInstalled || typeof document === 'undefined') return
	unlockInstalled = true

	const activate = () => {
		document.removeEventListener('pointerdown', activate, true)
		document.removeEventListener('keydown', activate, true)
		void unlockGameAudio()
	}

	document.addEventListener('pointerdown', activate, true)
	document.addEventListener('keydown', activate, true)
}
