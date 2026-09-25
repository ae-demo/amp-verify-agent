import ballerina/time;

// A configured base URL may end in `/`; join a path onto it instead of
// concatenating strings so a double slash never reaches the wire.
function stripTrailingSlash(string url) returns string {
    if url.endsWith("/") {
        return url.substring(0, url.length() - 1);
    }
    return url;
}

function utcToOptionalString(time:Utc? value) returns string? {
    if value is time:Utc {
        return time:utcToString(value);
    }
    return ();
}
