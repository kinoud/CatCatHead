
def color(s,c):
    c = {
        'red':31,
        'yellow':33,
        'blue':34,
        'green':32,
        'purple':35}.get(c)
    if c is None:
        c == 30
    return f'\033[1;{c}m{s}\033[0m'