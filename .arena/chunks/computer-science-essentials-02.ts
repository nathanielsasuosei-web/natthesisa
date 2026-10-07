{
  id: "binary-data",
  summary: [
    "A computer stores one kind of thing: a bit, which is either 0 or 1, because a switch with two reliable states is easy to build and hard to get wrong. Everything else — the number 42, the letter `ɛ`, a photograph, a song, this sentence — is a **convention for interpreting a pattern of bits**. That is the whole idea, and it is more powerful than it first appears: the same eight bits can be the number 65, the character `A`, or a shade of grey, and nothing in the memory itself says which.",
    "This lesson covers counting in binary and hexadecimal and converting between them, how bytes and words are sized, unsigned and signed integers and the two's-complement trick, floating-point numbers and why `0.1 + 0.2 !== 0.3`, character encodings from ASCII to UTF-8 and the mojibake they cause when confused, how images and sound are sampled into numbers, byte order, and the bitwise operations that let you work with flags, permissions and colours directly.",
  ],
  objectives: [
    "Convert between decimal, binary and hexadecimal by hand, using place values, and explain why hexadecimal is a convenient shorthand.",
    "Compute how many values n bits can hold and how many bits a given range needs.",
    "Explain two's complement and use it to represent and add negative numbers, including why there is one more negative value than positive.",
    "Describe the IEEE-754 floating-point format and explain precisely why decimal fractions such as 0.1 cannot be represented exactly.",
    "Choose the correct type for money and for identifiers, and justify it.",
    "Explain character encodings, code points and UTF-8, and diagnose a mojibake string.",
    "Compute the uncompressed size of an image and an audio clip from their dimensions, bit depth and sample rate.",
    "Use bitwise AND, OR, XOR, NOT and shifts to test, set and clear flags.",
  ],
  blocks: [
    {
      kind: "prose",
      heading: "Bits, bytes and the tyranny of two states",
      paragraphs: [
        "A **bit** is a single binary digit: 0 or 1. Physically it is a voltage above or below a threshold, a magnetic domain pointing one way or the other, a pit or a flat on a disc, a charge trapped in a cell. Two states, because two is the largest number of states that can be distinguished reliably in the presence of electrical noise. Everything else is convention.",
        "A **byte** is eight bits, and it is the smallest addressable unit in essentially every modern machine — you cannot ask for one bit of memory, only a byte that contains it. Eight bits give 2⁸ = 256 distinct patterns, which is why a byte can hold 0–255, or one ASCII character, or one channel of one pixel.",
        "The general rule is the one to memorise: **n bits represent 2ⁿ distinct values.** With 8 bits, 256; with 16, 65,536; with 32, about 4.29 billion; with 64, about 1.8 × 10¹⁹. Working backwards, to represent `k` different things you need `⌈log₂ k⌉` bits — 26 letters need 5 bits, a million products need 20, every person on earth needs 33.",
        "Units cause endless confusion, so be precise. A **kilobyte** in storage marketing is 1,000 bytes (decimal), while in memory it is traditionally 1,024 (2¹⁰). The IEC settled this with distinct names: **kB** = 1,000 bytes, **KiB** = 1,024 bytes; **MB** vs **MiB**, **GB** vs **GiB**. Your operating system reports a '500 GB' drive as 465 GiB and both numbers are correct — the drive holds 500 × 10⁹ bytes, and dividing by 2³⁰ gives 465. The gap grows with size: at 1 TB it is about 10%.",
      ],
    },
    {
      kind: "definition",
      term: "Bit, byte, word",
      text: "A **bit** is one binary digit, the unit of information. A **byte** is eight bits and the smallest addressable unit of memory. A **word** is the natural unit a processor handles at once — 64 bits on virtually every machine you will use — and it determines pointer size, register width and the largest integer the ALU handles in one instruction.",
    },
    {
      kind: "prose",
      heading: "Counting in binary",
      paragraphs: [
        "Binary is ordinary place-value arithmetic with base 2 instead of base 10. In decimal, each column is a power of ten — 4,327 means 4×1000 + 3×100 + 2×10 + 7×1. In binary each column is a power of two — 1, 2, 4, 8, 16, 32, 64, 128 — and each column holds only 0 or 1.",
        "So `1101` means 1×8 + 1×4 + 0×2 + 1×1 = 13. And to convert 42 to binary, find the largest power of two that fits, subtract, and repeat: 32 fits (42 − 32 = 10), 16 does not, 8 fits (10 − 8 = 2), 4 does not, 2 fits (2 − 2 = 0), 1 does not — giving `101010`. The mechanical method is repeated division by two, keeping the remainders and reading them **bottom to top**.",
      ],
    },
    {
      kind: "example",
      title: "Two conversions, done slowly",
      paragraphs: ["Decimal to binary by division, and binary to decimal by place value."],
      code: `42 ÷ 2 = 21 remainder 0   ← least significant bit
21 ÷ 2 = 10 remainder 1
10 ÷ 2 =  5 remainder 0
 5 ÷ 2 =  2 remainder 1
 2 ÷ 2 =  1 remainder 0
 1 ÷ 2 =  0 remainder 1   ← most significant bit

Read the remainders upward: 42₁₀ = 101010₂

Check: 32 + 0 + 8 + 0 + 2 + 0 = 42  ✓`,
      trace: [
        "Write the remainders in the order produced, then read them from the **last** to the **first**. Reading top-to-bottom is the most common error.",
        "Verify by adding the place values of the 1-columns: 2⁵=32, 2³=8, 2¹=2 → 42.",
        "The reverse direction is the same arithmetic: for each bit, if it is 1, add that column's power of two.",
        "Powers of two have exactly one 1 in binary — 1, 10, 100, 1000 — which is why `n & (n − 1) === 0` is the classic test for 'is n a power of two'.",
      ],
    },
    {
      kind: "prose",
      heading: "Hexadecimal: binary you can read",
      paragraphs: [
        "Binary is the machine's view but it is long: 32 bits is 32 characters. **Hexadecimal** (base 16, digits 0–9 then a–f) is the human compromise, because one hex digit is exactly four bits and sixteen is a power of two. Two hex digits are one byte; eight are a 32-bit word; sixteen are a 64-bit address. Conversion is therefore mechanical rather than arithmetic — split into groups of four and look each up.",
        "`1010 1010` → `a` `a` → `0xaa`. `0xff` → `1111 1111` → 255. This is why colours are written `#6d4aff` (three bytes: red 0x6d, green 0x4a, blue 0xff), why a SHA-256 hash prints as 64 hex characters (32 bytes), why IPv6 addresses are hex, and why every memory address in a debugger is hex. Learn the table 0–15 by heart; you will use it for the rest of your career.",
      ],
    },
    {
      kind: "table",
      caption: "Hex, decimal and binary for the digits you must know",
      head: ["hex", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"],
      rows: [
        ["**decimal**", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15"],
        ["**binary**", "0000", "0001", "0010", "0011", "0100", "0101", "0110", "0111", "1000", "1001", "1010", "1011", "1100", "1101", "1110", "1111"],
      ],
    },
    {
      kind: "prose",
      heading: "Signed integers and two's complement",
      paragraphs: [
        "A byte has 256 patterns. You could use one bit as a **sign** — 0 for positive, 1 for negative — and seven bits for magnitude, giving a range of −127 to +127. That is called sign-magnitude, and it is almost never used, for two good reasons: it has two zeros (`00000000` and `10000000`), and addition does not work — you cannot just add the bits and get the right answer, so hardware would need separate circuitry for subtraction.",
        "**Two's complement** solves both. To negate a number, invert every bit and add one. The most significant bit still indicates sign, but it now carries a weight of −2ⁿ⁻¹ instead of +2ⁿ⁻¹, and plain binary addition produces correct results for signed numbers with no special hardware at all. That is why every processor on earth uses it.",
        "The consequence is the asymmetry that catches people: an 8-bit two's-complement integer runs from **−128 to +127**, not −127 to +128. There is one extra negative value, because zero occupies a pattern that would otherwise be a positive. In 32 bits the range is −2,147,483,648 to 2,147,483,647 — and the famous '2.1 billion' bug, where a counter overflowed and broke systems from aircraft to game servers, is that upper limit being exceeded.",
        "**Overflow** is what happens when a result does not fit: adding 127 + 1 in 8 bits gives `01111111 + 00000001 = 10000000`, which is −128. The processor sets an overflow flag and carries on; nothing warns your program unless you check. In JavaScript the situation differs because numbers are 64-bit floats — integers are exact up to 2⁵³ − 1 (`Number.MAX_SAFE_INTEGER`, about 9 quadrillion), and beyond that they silently lose precision, which is why long identifiers must be handled as strings or `BigInt`.",
      ],
    },
    {
      kind: "example",
      title: "Two's complement arithmetic, by hand",
      paragraphs: ["Representing −13 in 8 bits, then adding it to 42 using ordinary binary addition."],
      code: ` 13      = 00001101
 invert  = 11110010
 add 1   = 11110011   ← this is −13

   42    = 00101010
 + (−13) = 11110011
 -------------------
         = 100011101  ← nine bits: the carry out is discarded
           00011101  = 29  ✓   (42 − 13 = 29)`,
      trace: [
        "Negation is invert-then-add-one. The same rule applied to −13 returns 13 — the operation is its own inverse.",
        "Addition is completely ordinary. The ninth bit falls off the end of the 8-bit register; that discarded carry is exactly what makes the arithmetic work.",
        "Check the answer by place value: 16 + 8 + 4 + 1 = 29.",
        "Now try −128 + −1: `10000000 + 11111111 = 01111111` (carry discarded) = +127. The result is not merely wrong, it is maximally wrong — the classic overflow surprise.",
      ],
    },
    {
      kind: "prose",
      heading: "Floating point: why 0.1 + 0.2 is not 0.3",
      paragraphs: [
        "Integers cannot express fractions, and fixed-point numbers (an agreed number of decimal places) cannot express the enormous range a scientific calculation needs. Computers therefore use **floating point**, the binary equivalent of scientific notation: a **sign**, a **significand** (the digits), and an **exponent** (where the point goes). The IEEE-754 standard defines the formats: `float32` uses 1 + 8 + 23 bits, and `float64` — the `number` type in JavaScript, Python, Java and most languages — uses 1 + 11 + 52 bits.",
        "The trouble is that the significand is **binary**, so it can only represent fractions that are sums of powers of *two*: 1/2, 1/4, 1/8, 3/8, and so on. In decimal, 1/3 is 0.3333… forever; in binary, **1/10 is 0.0001100110011… forever**. So 0.1 cannot be stored exactly — it is rounded to the nearest representable value, slightly above or below. Neither can 0.2. Adding two already-inexact values gives a third inexact value, and when it is printed with enough digits you see `0.30000000000000004`.",
        "This is not a JavaScript bug or a sloppiness in some library. It is arithmetic in base 2 with a finite number of digits, and every language that uses IEEE-754 doubles behaves identically. Three rules follow, and they are not optional in professional code. **Never store money in a floating-point number**: use integer minor units (pesewas, cents) or a decimal type (`BigDecimal`, Python's `decimal`, Postgres `numeric`). **Never compare floats for equality**: compare the absolute difference against a small epsilon, or use a library function that does. **Expect accumulated drift**: summing a million floats in different orders can give different results, because each addition rounds.",
      ],
    },
    {
      kind: "code",
      caption: "The behaviour, and the two correct fixes",
      language: "javascript",
      code: `0.1 + 0.2;                       // 0.30000000000000004
0.1 + 0.2 === 0.3;               // false
(0.1 + 0.2).toFixed(20);         // "0.30000000000000004441"

// Wrong: money as a float.
0.07 * 100;                      // 7.000000000000001  ← a pesewa that does not exist
let total = 0;
for (let i = 0; i < 10; i++) total += 0.1;
total;                           // 0.9999999999999999

// Right, fix 1: integers in the smallest unit.
const pesewas = 7 * 100;         // 700 pesewas = GH₵7.00, exact
const sumPesewas = Array.from({ length: 10 }, () => 10)
  .reduce((a, b) => a + b, 0);   // 100 pesewas = GH₵1.00, exact

// Right, fix 2: compare with a tolerance when you must use floats.
const nearlyEqual = (a, b, eps = Number.EPSILON) => Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
nearlyEqual(0.1 + 0.2, 0.3);     // true

// Integers are exact up to here — and this is why IDs arrive as strings.
Number.MAX_SAFE_INTEGER;         // 9007199254740991  (2^53 − 1)
Number.MAX_SAFE_INTEGER + 2 === Number.MAX_SAFE_INTEGER + 3;   // true (!)`,
    },
    {
      kind: "warning",
      label: "The identifier bug that costs real money",
      text: "A 64-bit integer id from a database — a tweet id, a Snowflake id, a large auto-increment — often exceeds 2⁵³, so JSON parsed into a JavaScript `number` silently rounds it. Two different records then look identical, and you update the wrong row. Every serious API returns such ids as **strings**, and every serious client keeps them as strings or `BigInt`. If you ever see an id ending in `00` that should not, this is why.",
    },
    {
      kind: "prose",
      heading: "Character encodings: from ASCII to UTF-8",
      paragraphs: [
        "Text is numbers too, so a **character encoding** is a table mapping numbers to characters. **ASCII** (1963) used 7 bits for 128 characters: the English alphabet in two cases, digits, punctuation and 33 control codes (`\\n` is 10, `\\t` is 9, `ESC` is 27, and the bell character that still makes your terminal beep is 7). It has no room for `é`, `ñ`, `ɛ`, `₵` or any non-Latin script.",
        "**Unicode** fixed this by assigning every character in every writing system a **code point** — a number, written `U+0041` for `A`, `U+00E9` for `é`, `U+1F600` for `😀`, `U+20B5` for `₵`. Over 150,000 are assigned. Unicode defines the *characters*; it does not by itself say how they become bytes. That is the job of a **Unicode Transformation Format**.",
        "**UTF-8** is the encoding of the web — roughly 98% of all pages. It is a variable-length scheme with an elegant design: code points 0–127 are one byte, *identical to ASCII*, so every ASCII document is already valid UTF-8; higher code points take two, three or four bytes, with the leading bits marking how many. `é` (U+00E9) is two bytes, `₵` (U+20B5) three, `😀` four. There are no byte-order issues, no null bytes, and a truncated file loses one character rather than everything after it.",
        "The alternative, **UTF-16**, uses two bytes for most characters and four for those beyond the Basic Multilingual Plane. It is what JavaScript strings, Java and Windows use internally — which is why `'😀'.length === 2` in JavaScript: `.length` counts UTF-16 code units, not characters. Use `[...str]` or `Array.from(str)` to get real characters.",
        "**Mojibake** — `Ã©` where you meant `é`, `â€™` where you meant `'` — is what happens when bytes written in one encoding are read as another. `é` in UTF-8 is the two bytes `0xC3 0xA9`; interpret those two bytes as Latin-1 and you get `Ã` (0xC3) followed by `©` (0xA9). The fix is never to string-replace the damage; it is to declare the encoding correctly at every boundary: `<meta charset=\"utf-8\">` in HTML, `Content-Type: text/html; charset=utf-8` in HTTP, `client_encoding=UTF8` in the database, and `-Encoding utf8` when you read files. When in doubt, `file -i somefile` and `hexdump -C somefile | head` show the truth.",
      ],
    },
    {
      kind: "table",
      caption: "One character, four encodings",
      head: ["Character", "Code point", "UTF-8", "UTF-16", "Latin-1"],
      rows: [
        ["`A`", "U+0041", "`41`", "`0041`", "`41`"],
        ["`é`", "U+00E9", "`C3 A9`", "`00E9`", "`E9`"],
        ["`ɛ` (open e, Twi)", "U+025B", "`C9 9B`", "`025B`", "not representable"],
        ["`₵` (cedi sign)", "U+20B5", "`E2 82 B5`", "`20B5`", "not representable"],
        ["`😀`", "U+1F600", "`F0 9F 98 80`", "`D83D DE00` (a surrogate pair)", "not representable"],
      ],
    },
    {
      kind: "prose",
      heading: "Images and sound as numbers",
      paragraphs: [
        "A **raster image** is a grid of pixels, and each pixel is a set of numbers — one per channel. In 8-bit RGB that is three bytes per pixel: red, green, blue, each 0–255, mixing to 16,777,216 colours. Add an alpha channel (RGBA) and it is four. So an uncompressed 1920×1080 RGBA image is `1920 × 1080 × 4 = 8,294,400 bytes`, about 8.3 MB — which is why images are *compressed* before they are stored: PNG compresses losslessly, JPEG and WebP compress lossily by discarding detail the eye is least sensitive to, and AVIF further still.",
        "A **vector image** stores no pixels at all — it stores drawing instructions ('a line from here to there, a curve with these control points, fill with this colour'), so it scales to any size without degradation. SVG is vector and is XML; use it for logos, icons and diagrams, and raster for photographs.",
        "**Sound** is a continuous pressure wave, made digital by **sampling**: measure the amplitude at regular intervals. CD audio samples 44,100 times a second (44.1 kHz) at 16 bits per sample, in two channels: `44100 × 2 bytes × 2 channels × 60 seconds = 10.6 MB per minute`, uncompressed. That is the WAV/AIFF number; MP3, AAC and Opus compress it by a factor of ten or more by discarding what the ear masks. **Sample rate** limits the highest frequency you can capture — the Nyquist theorem says you must sample at more than twice the frequency, which is why 44.1 kHz was chosen for audio whose useful range ends around 20 kHz.",
      ],
    },
    {
      kind: "formula",
      expression: "image bytes = width × height × channels × bytes-per-channel      audio bytes = sample rate × seconds × channels × bit depth / 8",
      where: [
        "Both give the **uncompressed** size; every real file is smaller because of compression.",
        "A 4K frame (3840×2160) in 8-bit RGB is 24.9 MB — and at 60 frames a second that is 1.5 GB/s of raw video, which is why video codecs exist.",
        "Doubling the width *and* height quadruples the pixel count. This is why 'just make the image bigger' is never a small change.",
      ],
    },
    {
      kind: "prose",
      heading: "Bitwise operations",
      paragraphs: [
        "Because data is bits, you can manipulate it directly, and in some places that is the natural tool. **AND** (`&`) keeps only the bits set in both operands — used to *test* whether a flag is set. **OR** (`|`) sets the bits present in either — used to *turn on* a flag. **XOR** (`^`) sets the bits present in exactly one — used to *toggle*, and famously to swap two values without a temporary. **NOT** (`~`) inverts every bit. **Left shift** (`<<`) multiplies by a power of two; **right shift** (`>>`) divides, rounding towards negative infinity (use `>>>` in JavaScript for an unsigned shift that fills with zeros).",
        "The classic application is **flags packed into one integer**: Unix file permissions are three bits for owner, three for group, three for others — `rwxr-xr--` is `111 101 100` = `0o754`. Colour values are three bytes in one number. Feature toggles, permission sets and bitmask-based state all work this way, and reading `mode & 0o400` as 'is the owner-read bit set?' is a skill worth having.",
        "In JavaScript, bitwise operators coerce their operands to **32-bit signed integers** and return one, so `x | 0` truncates a float to a 32-bit int — a trick you will see in old code. Be careful: it silently breaks for values above 2³¹, and `Math.trunc` says what you mean more clearly.",
      ],
    },
    {
      kind: "code",
      caption: "Flags, masks and colours",
      language: "javascript",
      code: `const READ = 1 << 0;     // 0b0001
const WRITE = 1 << 1;    // 0b0010
const DELETE = 1 << 2;   // 0b0100
const ADMIN = 1 << 3;    // 0b1000

let perms = READ | WRITE;             // 0b0011 — grant two at once
(perms & DELETE) !== 0;               // false — test one bit
perms |= DELETE;                      // grant delete
perms &= ~WRITE;                      // revoke write, keep the rest
perms ^= READ;                        // toggle read (off, here)

// A colour is three bytes in one number.
const rgb = (r, g, b) => (r << 16) | (g << 8) | b;
const red   = (c) => (c >> 16) & 0xff;
const green = (c) => (c >> 8) & 0xff;
const blue  = (c) => c & 0xff;
rgb(109, 74, 255).toString(16);       // "6d4aff" — the hex colour, derived

// Is a power of two? Exactly one bit set.
const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;

// Parity, and the XOR swap trick.
const parity = (n) => n.toString(2).split("1").length % 2 === 0 ? 0 : 1;
let a = 5, b = 9; a ^= b; b ^= a; a ^= b;   // a === 9, b === 5`,
    },
    {
      kind: "note",
      label: "Byte order (endianness)",
      text: "A multi-byte number can be stored most-significant-byte first (**big-endian**, the way humans write numbers, and what network protocols use) or least-significant-byte first (**little-endian**, what x86 and ARM do in practice). `0x12345678` sits in little-endian memory as `78 56 34 12`. You meet this whenever you read a binary file, parse a network packet, or use a `DataView` — which is why `DataView.getInt32(offset, littleEndian)` asks. The classic symptom is a number that looks like the right digits in the wrong order.",
    },
    {
      kind: "terms",
      heading: "Key terms",
      items: [
        { term: "Bit / byte / word", text: "One binary digit; eight of them; the processor's natural unit (64 bits)." },
        { term: "LSB / MSB", text: "Least and most significant bit — the smallest and largest place values." },
        { term: "Two's complement", text: "The standard representation of signed integers: invert and add one to negate; plain addition still works." },
        { term: "Overflow", text: "A result too large for the type, which wraps around silently unless checked." },
        { term: "IEEE-754", text: "The floating-point standard: sign, exponent, significand. `float64` is `number` in JavaScript." },
        { term: "Significand / exponent", text: "The digits and the scale of a floating-point number — binary scientific notation." },
        { term: "Code point", text: "A number assigned by Unicode to a character, written `U+20B5`." },
        { term: "UTF-8", text: "The variable-length encoding of Unicode that is backwards-compatible with ASCII and used by almost the whole web." },
        { term: "Mojibake", text: "Text corrupted by decoding bytes with the wrong encoding: `Ã©` for `é`." },
        { term: "Sampling rate / bit depth", text: "How often audio is measured, and how precisely each measurement is stored." },
        { term: "Bitmask", text: "An integer used as a set of independent on/off flags, manipulated with `&`, `|`, `^` and shifts." },
        { term: "Endianness", text: "The order in which a multi-byte number's bytes are stored." },
      ],
    },
    {
      kind: "prose",
      heading: "Looking at the actual bits",
      paragraphs: [
        "You can inspect any of this directly, and doing it once makes it concrete forever. In a browser console, `(65).toString(2)` prints `1000001` and `(255).toString(16)` prints `ff`. In JavaScript, a `DataView` over an `ArrayBuffer` shows you the exact bytes of a float. On the command line, `hexdump -C file` prints bytes in hex with their ASCII interpretation alongside — and that side-by-side view is precisely how you diagnose an encoding problem: find where the ASCII column stops making sense.",
      ],
    },
    {
      kind: "code",
      caption: "Seeing the bytes of 0.1",
      language: "javascript",
      code: `const buf = new ArrayBuffer(8);
new DataView(buf).setFloat64(0, 0.1);
[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join(" ");
// "00 00 00 00 00 00 59 3f"  ← little-endian; reverse it and you get
// 3f5999999999999a, the IEEE-754 double nearest to 0.1.
// The trailing ...9a is the rounding — 0.1 does not fit.

(0.1).toPrecision(20);   // "0.10000000000000000555"
(1 / 3).toPrecision(20); // "0.33333333333333331483"  ← the same problem in decimal`,
    },
  ],
  practice: {
    challenge:
      "Convert the decimal numbers **7, 18 and 42** to binary using the place-value method, showing every step. Then convert each back to decimal as a check, convert all three to hexadecimal, and state how many bits each needs. Finally, represent **−18** in 8-bit two's complement and prove your answer by adding it to 18 in binary and confirming you get zero (with the carry discarded).",
    exercises: [
      {
        prompt: "How many distinct values can be stored in 5 bits, 12 bits and 20 bits? How many bits do you need for 26 lowercase letters, for the 1,112 possible Twi syllables, and for every person on earth?",
        hint: "2ⁿ values from n bits; ⌈log₂ k⌉ bits for k things. log₂ 8,000,000,000 is between 32 and 33.",
      },
      {
        prompt: "Convert `0b11011010` to decimal and hexadecimal, and `0x3f` to binary and decimal, without a calculator.",
        hint: "For hex, split into nibbles: `1101 1010` → `d` `a`. `0x3f` → `0011 1111`.",
      },
      {
        prompt: "What are the ranges of a signed 8-bit, 16-bit and 32-bit two's-complement integer? Explain why the negative end is one larger in magnitude than the positive end.",
        hint: "−2ⁿ⁻¹ to 2ⁿ⁻¹ − 1. Zero consumes a pattern that would otherwise be positive.",
      },
      {
        prompt: "Predict the output before running it: `0.1 + 0.7 === 0.8`, `(1.005).toFixed(2)`, `0.3 - 0.1`, `Number.MAX_SAFE_INTEGER + 1 === Number.MAX_SAFE_INTEGER + 2`. Then explain each result in terms of the significand.",
        hint: "Three of the four are `false` or otherwise surprising. `toFixed` rounds a value that is already slightly below what you wrote.",
      },
      {
        prompt: "A shop charges GH₵ 12.99 for three items. Compute the total using floats and using integer pesewas, and state which you would put in a database column and why.",
        hint: "`12.99 * 3` is not exactly `38.97`. Store `1299` pesewas in an integer column, or use `numeric(10,2)` in Postgres.",
      },
      {
        prompt: "The string `CafÃ©` appeared in your app instead of `Café`. Explain exactly what happened, byte by byte, and list the four places you would fix it.",
        hint: "`é` is `C3 A9` in UTF-8; read as Latin-1 those two bytes are `Ã` and `©`. Fix the HTML meta, the HTTP header, the database client encoding and the file read.",
      },
      {
        prompt: "Compute the uncompressed size of a 3840×2160 8-bit RGB image and of 3 minutes of 44.1 kHz 16-bit stereo audio. Then say roughly what a WebP and an Opus encoding of each might weigh.",
        hint: "Image: 24.9 MB. Audio: 31.8 MB. Compression typically gives a 10–20× reduction for images and 10× for audio.",
      },
      {
        prompt: "Using the READ/WRITE/DELETE/ADMIN bitmask, write functions `can(user, permission)`, `grant(user, permission)` and `revoke(user, permission)`, and a `describe(user)` that returns an array of the granted names.",
        hint: "`can` is `(perms & flag) !== 0`; `grant` is `|= flag`; `revoke` is `&= ~flag`. `describe` filters the names by `can`.",
      },
      {
        prompt: "Explain why `'😀'.length === 2` in JavaScript and how to count the actual characters. Then find the length of `'ɛ'` and say why it differs.",
        hint: "`.length` counts UTF-16 code units; the emoji is outside the Basic Multilingual Plane and needs a surrogate pair. `ɛ` is inside it, so one unit.",
      },
    ],
    checkYourself: [
      "How many values does n bits hold, and how many bits do you need for k things?",
      "Why is hexadecimal used instead of binary in debuggers, and what is the exact relationship between them?",
      "Describe the two's-complement negation rule and why it makes signed addition need no special hardware.",
      "Why can a binary fraction not represent 0.1 exactly, and what two rules follow for money and comparisons?",
      "Why must large integer identifiers travel as strings in JSON?",
      "What is a code point, what is UTF-8, and why is UTF-8 compatible with ASCII?",
      "What causes mojibake, and why is a find-and-replace the wrong fix?",
      "Which bitwise operator tests a flag, which sets one, and which clears one?",
    ],
  },
  takeaways: [
    "A bit pattern has no meaning until a format interprets it — the same byte can be 65, `A`, or a shade of grey.",
    "n bits hold 2ⁿ values; hexadecimal is binary in groups of four and is what you should read and write.",
    "Signed integers are two's complement, so addition works unchanged and the negative range is one wider.",
    "Floats are binary scientific notation with finite digits: 0.1 is not exact, money must be integers or decimals, and equality must be a tolerance.",
    "Unicode assigns code points; UTF-8 encodes them in one to four bytes and is ASCII-compatible. Declare the encoding at every boundary.",
    "Images are pixels × channels; audio is samples × depth × channels — both uncompressed numbers that compression then shrinks.",
    "Bitwise operators are the natural tool for flags, permissions and packed values.",
  ],
  further: [
    "Next: [[Logic & algorithms|/learn/computer-science-essentials/logic-algorithms]] — turning these representations into procedures.",
    "[[Big-O without the fear|/learn/data-structures-algorithms/big-o-not-scary]] measures how the cost of those procedures grows.",
    "Play with `toString(2)`, `toString(16)` and a `DataView` until converting a byte by hand feels ordinary.",
  ],
},
