interface HistogramState {
	help: string
	buckets: number[]
	counts: number[]
	count: number
	sum: number
}

const counters = new Map<string, { help: string; value: number }>()
const histograms = new Map<string, HistogramState>()

function increment(name: string, help: string, amount = 1) {
	const metric = counters.get(name) ?? { help, value: 0 }
	metric.value += amount
	counters.set(name, metric)
}

function observe(name: string, help: string, value: number, buckets: number[]) {
	const metric = histograms.get(name) ?? {
		help,
		buckets,
		counts: buckets.map(() => 0),
		count: 0,
		sum: 0,
	}
	metric.count += 1
	metric.sum += value
	for (let index = 0; index < metric.buckets.length; index++) {
		if (value <= metric.buckets[index]) metric.counts[index] += 1
	}
	histograms.set(name, metric)
}

export const gameMetrics = {
	vote() {
		increment('fikifor_game_votes_total', 'Accepted gameplay vote operations')
	},
	voteRejected() {
		increment('fikifor_game_vote_rejections_total', 'Rejected gameplay vote operations')
	},
	finalized() {
		increment('fikifor_game_finalizations_total', 'Completed match finalizations')
	},
	transitionFailure() {
		increment(
			'fikifor_game_transition_failures_total',
			'Gameplay transition and deadline failures',
		)
	},
	voteDuration(milliseconds: number) {
		observe(
			'fikifor_game_vote_duration_ms',
			'End-to-end vote operation duration in milliseconds',
			milliseconds,
			[5, 10, 25, 50, 100, 250, 500, 1_000, 2_500],
		)
	},
	finalizationLockWait(milliseconds: number) {
		observe(
			'fikifor_game_finalization_lock_wait_ms',
			'Finalization advisory lock wait in milliseconds',
			milliseconds,
			[1, 2, 5, 10, 25, 50, 100, 250, 500, 1_000],
		)
	},
}

export function renderMetrics(
	gauges: Record<string, { help: string; value: number }> = {},
) {
	const lines: string[] = []
	for (const [name, metric] of counters) {
		lines.push(
			`# HELP ${name} ${metric.help}`,
			`# TYPE ${name} counter`,
			`${name} ${metric.value}`,
		)
	}
	for (const [name, metric] of histograms) {
		lines.push(`# HELP ${name} ${metric.help}`, `# TYPE ${name} histogram`)
		for (let index = 0; index < metric.buckets.length; index++) {
			lines.push(`${name}_bucket{le="${metric.buckets[index]}"} ${metric.counts[index]}`)
		}
		lines.push(
			`${name}_bucket{le="+Inf"} ${metric.count}`,
			`${name}_sum ${metric.sum}`,
			`${name}_count ${metric.count}`,
		)
	}
	for (const [name, metric] of Object.entries(gauges)) {
		lines.push(
			`# HELP ${name} ${metric.help}`,
			`# TYPE ${name} gauge`,
			`${name} ${metric.value}`,
		)
	}
	return `${lines.join('\n')}\n`
}
