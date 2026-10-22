def raise_walk_error(error: OSError) -> None:
    """Refuse an apparently complete inventory after a traversal failure."""
    raise error
