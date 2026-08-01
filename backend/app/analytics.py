import math
from collections import defaultdict

from scipy.stats import binomtest

from .models import Response
from .schemas import ChoiceMetric, SegmentMetric


def wilson_interval(successes: int, total: int, z: float = 1.96) -> tuple[float, float]:
    if total == 0:
        return (0.0, 0.0)
    proportion = successes / total
    denominator = 1 + z * z / total
    center = (proportion + z * z / (2 * total)) / denominator
    spread = z * math.sqrt(
        proportion * (1 - proportion) / total + z * z / (4 * total * total)
    ) / denominator
    return (max(0.0, center - spread), min(1.0, center + spread))


def choice_metrics(responses: list[Response]) -> list[ChoiceMetric]:
    grouped: dict[str, list[Response]] = defaultdict(list)
    for response in responses:
        grouped[response.selected_variation.label].append(response)
    total = len(responses)
    return [
        ChoiceMetric(
            label=label,
            count=len(grouped[label]),
            percentage=round(len(grouped[label]) / total * 100, 1) if total else 0,
            average_latency_ms=round(
                sum(r.decision_latency_ms for r in grouped[label]) / len(grouped[label]), 1
            ) if grouped[label] else 0,
        )
        for label in ("A", "B")
    ]


def device_metrics(responses: list[Response]) -> list[SegmentMetric]:
    grouped: dict[str, list[Response]] = defaultdict(list)
    for response in responses:
        grouped[response.device_type].append(response)
    result = []
    for segment in sorted(grouped):
        values = grouped[segment]
        b_count = sum(r.selected_variation.label == "B" for r in values)
        result.append(
            SegmentMetric(
                segment=segment.title(),
                responses=len(values),
                variation_b_percentage=round(b_count / len(values) * 100, 1),
                average_latency_ms=round(
                    sum(r.decision_latency_ms for r in values) / len(values), 1
                ),
            )
        )
    return result


def significance(responses: list[Response]) -> tuple[float, tuple[float, float], bool]:
    total = len(responses)
    if total == 0:
        return (1.0, (0.0, 0.0), False)
    b_count = sum(r.selected_variation.label == "B" for r in responses)
    p_value = float(binomtest(b_count, total, p=0.5).pvalue)
    interval = wilson_interval(b_count, total)
    return (p_value, interval, p_value < 0.05)

