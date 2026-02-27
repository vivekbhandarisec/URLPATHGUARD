import re

# Supports common/combined log formats and captures both referrer and user-agent when present.
LOG_PATTERN = re.compile(
    r'^'
    r'(\d{1,3}(?:\.\d{1,3}){3})\s+'  # ip
    r'\S+\s+\S+\s+'
    r'\[([^\]]+)\]\s+'  # timestamp
    r'"([A-Z]+)\s+(.+?)\s+HTTP\/\d(?:\.\d)?"\s+'  # method, path/request-target
    r'(\d{3})\s+\S+'  # status, bytes
    r'(?:\s+"([^"]*)")?'  # optional referrer
    r'(?:\s+"([^"]*)")?'  # optional user-agent
)


def parse_log(line):
    match = LOG_PATTERN.search(line)
    if not match:
        return None

    ip, timestamp, method, path, status, referrer, user_agent = match.groups()
    # If only one quoted field exists, treat it as user-agent for backward compatibility.
    resolved_user_agent = user_agent if user_agent is not None else (referrer or "")

    return ip, timestamp, method, path, status, resolved_user_agent
