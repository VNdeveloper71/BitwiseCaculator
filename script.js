const inputA = document.querySelector("#number-a");
const inputB = document.querySelector("#number-b");
const shiftInput = document.querySelector("#shift-a");
const shiftCountInput = document.querySelector("#shift-count");
const inputFormat = document.querySelector("#id_data_type");
const result = document.querySelector("#result");
const int32Min = -2147483648;
const int32Max = 2147483647;

function showResults() {
    result.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateInputPlaceholders() {
    const example = inputFormat.value === "2" ? "e.g. 101" : "e.g. 5";
    [inputA, inputB, shiftInput].forEach((input) => {
        input.placeholder = example;
    });
}

function switchMode(mode) {
    const isMode1 = mode === 1;
    document.querySelector("#mode1").classList.toggle("hidden", !isMode1);
    document.querySelector("#mode2").classList.toggle("hidden", isMode1);
    document.querySelector("#btn1").classList.toggle("active", isMode1);
    document.querySelector("#btn2").classList.toggle("active", !isMode1);
    result.replaceChildren(document.createTextNode("Nhập số nguyên rồi chọn phép toán."));
}

function toBinary(value, width) {
    return (value >>> 0).toString(2).slice(-width).padStart(width, "0");
}

function getNotDisplayWidth(value) {
    return value < 0 ? 14 : Math.max(8, value.toString(2).length);
}

function createBitRow(label, value, width, showIndices = false) {
    const row = document.createElement("div");
    row.className = showIndices ? "bit-row bit-index-row" : "bit-row";
    row.style.gridTemplateColumns = `3.8rem repeat(${width}, minmax(1.75rem, 1fr))`;

    const rowLabel = document.createElement("span");
    rowLabel.className = "bit-row-label";
    rowLabel.textContent = label;
    row.append(rowLabel);

    const bits = toBinary(value, width);
    for (let index = 0; index < width; index += 1) {
        const bit = document.createElement("span");
        bit.className = `bit-cell${!showIndices && bits[index] === "1" ? " is-on" : ""}`;
        bit.textContent = showIndices ? String(width - index - 1) : bits[index];
        row.append(bit);
    }

    return row;
}

function showOperation(label, operator, a, b, value, expression, displayWidth = null) {
    const article = document.createElement("article");
    article.className = "operation-result";

    const heading = document.createElement("h2");
    heading.textContent = label;
    article.append(heading);

    const numbers = b === null ? [a, value] : [a, b, value];
    const width = displayWidth ?? (
        numbers.some((number) => number < 0)
            ? 32
            : Math.max(8, ...numbers.map((number) => number.toString(2).length))
    );
    const calculation = document.createElement("div");
    calculation.className = "bit-calculation";
    calculation.append(createBitRow("", a, width, true));
    calculation.append(createBitRow("Input", a, width));

    const operatorLine = document.createElement("div");
    operatorLine.className = "bit-operator-row";
    operatorLine.style.gridTemplateColumns = `3.8rem repeat(${width}, minmax(1.75rem, 1fr))`;
    const operatorLabel = document.createElement("span");
    operatorLabel.className = "bit-row-label";
    operatorLine.append(operatorLabel);
    const operatorValue = document.createElement("span");
    operatorValue.className = "bit-operator";
    operatorValue.textContent = operator;
    operatorLine.append(operatorValue);
    calculation.append(operatorLine);

    if (b !== null) {
        calculation.append(createBitRow("Input", b, width));
    }

    const divider = document.createElement("hr");
    divider.className = "bit-divider";
    calculation.append(divider);
    calculation.append(createBitRow("Output", value, width));
    article.append(calculation);

    const integerExpression = document.createElement("p");
    integerExpression.className = "integer-expression";
    integerExpression.textContent = expression;
    article.append(integerExpression);

    return article;
}

function readInt32(input, label) {
    const rawValue = input.value.trim();
    const radix = Number(inputFormat.value);
    let value;

    if (radix === 2) {
        if (!/^-?[01]+$/.test(rawValue)) {
            result.textContent = `${label} phải là số nhị phân chỉ gồm 0 và 1.`;
            return null;
        }

        const isNegative = rawValue.startsWith("-");
        const digits = isNegative ? rawValue.slice(1) : rawValue;
        const binaryValue = BigInt(`0b${digits}`) * (isNegative ? -1n : 1n);
        if (binaryValue < BigInt(int32Min) || binaryValue > BigInt(int32Max)) {
            result.textContent = `${label} phải nằm trong khoảng ${int32Min} đến ${int32Max}.`;
            return null;
        }
        value = Number(binaryValue);
    } else {
        if (!/^-?\d+$/.test(rawValue)) {
            result.textContent = `${label} phải là số nguyên thập phân.`;
            return null;
        }
        value = Number(rawValue);
    }

    if (
        !Number.isInteger(value) ||
        value < int32Min ||
        value > int32Max
    ) {
        result.textContent =
            `${label} phải là số nguyên trong khoảng ${int32Min} đến ${int32Max}.`;
        return null;
    }
    return value;
}

function calculateBinary(operation) {
    const a = readInt32(inputA, "a");
    const b = readInt32(inputB, "b");
    if (a === null || b === null) return;

    const operations = {
        AND: ["AND", "&", a & b],
        OR: ["OR", "|", a | b],
        XOR: ["XOR", "^", a ^ b],
    };
    result.replaceChildren();

    if (operation === "ALL") {
        Object.values(operations).forEach(([label, operator, value]) => {
            result.append(
                showOperation(label, operator, a, b, value, `${a} ${operator} ${b} = ${value}`)
            );
        });
        showResults();
        return;
    }

    const [label, operator, value] = operations[operation];
    result.append(
        showOperation(label, operator, a, b, value, `${a} ${operator} ${b} = ${value}`)
    );
    showResults();
}

function calculateShift(operation) {
    const value = readInt32(shiftInput, "a");
    if (value === null) return;

    if (operation === "NOT") {
        const answer = ~value;
        const width = getNotDisplayWidth(value);
        result.replaceChildren(
            showOperation("NOT", "~", value, null, answer, `~${value} = ${answer}`, width)
        );
        showResults();
        return;
    }

    const shiftCount = shiftCountInput.valueAsNumber;
    if (!Number.isInteger(shiftCount) || shiftCount < 0 || shiftCount > 31) {
        result.textContent = "Số bit dịch phải là số nguyên từ 0 đến 31.";
        return;
    }

    const operations = {
        LEFT: ["Dịch trái", "<<", value << shiftCount],
        RIGHT: ["Dịch phải", ">>", value >> shiftCount],
    };
    result.replaceChildren();

    if (operation === "ALL") {
        Object.values(operations).forEach(([label, operator, answer]) => {
            result.append(
                showOperation(
                    label,
                    operator,
                    value,
                    null,
                    answer,
                    `${value} ${operator} ${shiftCount} = ${answer}`
                )
            );
        });
        const notResult = ~value;
        const notWidth = getNotDisplayWidth(value);
        result.append(
            showOperation(
                "NOT",
                "~",
                value,
                null,
                notResult,
                `~${value} = ${notResult}`,
                notWidth
            )
        );
        showResults();
        return;
    }

    const [label, operator, answer] = operations[operation];
    result.append(
        showOperation(
            label,
            operator,
            value,
            null,
            answer,
            `${value} ${operator} ${shiftCount} = ${answer}`
        )
    );
    showResults();
}

document.querySelector("#btn1").addEventListener("click", () => switchMode(1));
document.querySelector("#btn2").addEventListener("click", () => switchMode(2));
inputFormat.addEventListener("change", () => {
    updateInputPlaceholders();
    result.replaceChildren(
        document.createTextNode("Định dạng đã đổi. Hãy nhập lại giá trị rồi chọn phép toán.")
    );
});
document.querySelector("#AND").addEventListener("click", () => calculateBinary("AND"));
document.querySelector("#OR").addEventListener("click", () => calculateBinary("OR"));
document.querySelector("#XOR").addEventListener("click", () => calculateBinary("XOR"));
document.querySelector("#ALL-BINARY").addEventListener("click", () => calculateBinary("ALL"));
document.querySelector("#LEFT").addEventListener("click", () => calculateShift("LEFT"));
document.querySelector("#RIGHT").addEventListener("click", () => calculateShift("RIGHT"));
document.querySelector("#NOT").addEventListener("click", () => calculateShift("NOT"));
document.querySelector("#ALL-SHIFT").addEventListener("click", () => calculateShift("ALL"));
document.querySelector("#RESET").addEventListener("click", () => {
    inputA.value = "";
    inputB.value = "";
    shiftInput.value = "";
    shiftCountInput.value = "";
    result.replaceChildren(document.createTextNode("Nhập số nguyên rồi chọn phép toán."));
    (document.querySelector("#mode1").classList.contains("hidden") ? shiftInput : inputA).focus();
});

updateInputPlaceholders();