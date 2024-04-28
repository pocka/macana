## C

```c
char foo;

// This is line comment
int main(int argc, char *argv[]) {
	/*
	  This is block comment
	 */
}
```

## Zig

```zig
export fn foo(bar: []const u8) usize {
	// This is line comment
}

/// This is doc comment
pub fn main() !void {
	const _ = foo("Bar");
}
```