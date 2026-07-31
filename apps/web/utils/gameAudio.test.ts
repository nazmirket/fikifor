import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('game audio', () => {
	beforeEach(() => {
		vi.resetModules()
		vi.unstubAllGlobals()
	})

	it('resumes the shared audio context and plays a decoded sound', async () => {
		const start = vi.fn()
		const fetch = vi.fn(async () => ({
			ok: true,
			arrayBuffer: async () => new ArrayBuffer(8),
		}))

		class FakeAudioContext {
			state = 'suspended'
			destination = {}

			async resume() {
				this.state = 'running'
			}

			async decodeAudioData() {
				return {}
			}

			createBufferSource() {
				return {
					buffer: null,
					connect: vi.fn(),
					start,
				}
			}
		}

		vi.stubGlobal('window', { AudioContext: FakeAudioContext, fetch })
		const { playGameSound, unlockGameAudio } = await import('./gameAudio')

		await expect(unlockGameAudio()).resolves.toBe(true)
		await expect(playGameSound('win')).resolves.toBe(true)
		expect(fetch).toHaveBeenCalledWith('/sounds/win.m4a', { cache: 'force-cache' })
		expect(start).toHaveBeenCalledOnce()
	})
})
