const inputValue = document.querySelector('#input-value');
const outputValue = document.querySelector('#output-value');
const inputBase = document.querySelector('#input-base');
const outputBase = document.querySelector('#output-base');
const inputCustomBase = document.querySelector('#input-custom-base');
const outputCustomBase = document.querySelector('#output-custom-base');
const inputBaseLabel = document.querySelector('#input-base-label');
const outputBaseLabel = document.querySelector('#output-base-label');
const statusLine = document.querySelector('#status-line');
const historyList = document.querySelector('#history-list');
const copyButton = document.querySelector('#copy-button');
const history = [];

function getBase(select, customInput) {
  return select.value === 'custom' ? Number(customInput.value) : Number(select.value);
}

function formatBase(base) {
  return `BASE ${base}`;
}

function updateCustomField(select, customInput) {
  customInput.parentElement.classList.toggle('hidden', select.value !== 'custom');
}

// Parse every value as BigInt so large numbers stay exact during conversion.
function parseValue(value, base) {
  const normalized = value.trim().toUpperCase();
  if (!normalized) throw new Error('Enter a value to convert.');
  if (!Number.isInteger(base) || base < 2 || base > 36) throw new Error('Bases must be whole numbers from 2 to 36.');
  const validDigits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.slice(0, base);
  if ([...normalized].some((digit) => !validDigits.includes(digit))) {
    throw new Error(`That value contains a digit outside base ${base}.`);
  }
  return [...normalized].reduce((total, digit) => total * BigInt(base) + BigInt(validDigits.indexOf(digit)), 0n);
}

function convert(value, fromBase, toBase) {
  const decimal = parseValue(value, fromBase);
  return decimal.toString(toBase).toUpperCase();
}

// Keep the five most recent successful conversions visible below the tool.
function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = '<p class="empty-history">Your recent conversions will appear here.</p>';
    return;
  }
  historyList.innerHTML = history.map((item) => `
    <div class="history-item">
      <span>${item.input}</span><span class="arrow">→</span><span>${item.output}</span>
      <span class="base">base ${item.from} → base ${item.to}</span>
    </div>
  `).join('');
}

function addHistory(input, output, from, to) {
  const previous = history[0];
  if (previous && previous.input === input && previous.from === from && previous.to === to) return;
  history.unshift({ input, output, from, to });
  if (history.length > 5) history.pop();
  renderHistory();
}

// Update the result and status message whenever a conversion control changes.
function runConversion({ record = true } = {}) {
  const from = getBase(inputBase, inputCustomBase);
  const to = getBase(outputBase, outputCustomBase);
  inputBaseLabel.textContent = formatBase(from);
  outputBaseLabel.textContent = formatBase(to);
  try {
    const result = convert(inputValue.value, from, to);
    outputValue.textContent = result;
    statusLine.textContent = `${inputValue.value.trim().toUpperCase()} translated from base ${from} to base ${to}.`;
    statusLine.classList.remove('error');
    if (record) addHistory(inputValue.value.trim().toUpperCase(), result, from, to);
  } catch (error) {
    outputValue.textContent = '—';
    statusLine.textContent = error.message;
    statusLine.classList.add('error');
  }
}

// Input and base changes should feel immediate, without a submit step.
[inputValue, inputBase, outputBase, inputCustomBase, outputCustomBase].forEach((element) => {
  element.addEventListener('input', () => runConversion());
  element.addEventListener('change', () => runConversion());
});

// Custom base fields only appear when their matching select is active.
[inputBase, outputBase].forEach((select) => {
  const customInput = select === inputBase ? inputCustomBase : outputCustomBase;
  select.addEventListener('change', () => updateCustomField(select, customInput));
});

document.querySelector('#swap-button').addEventListener('click', () => {
  const currentOutput = outputValue.textContent;
  const oldInputBase = inputBase.value;
  const oldInputCustom = inputCustomBase.value;
  inputValue.value = currentOutput === '—' ? inputValue.value : currentOutput;
  inputBase.value = outputBase.value;
  outputBase.value = oldInputBase;
  inputCustomBase.value = outputCustomBase.value;
  outputCustomBase.value = oldInputCustom;
  updateCustomField(inputBase, inputCustomBase);
  updateCustomField(outputBase, outputCustomBase);
  runConversion();
});

document.querySelectorAll('.preset').forEach((preset) => {
  preset.addEventListener('click', () => {
    inputBase.value = preset.dataset.from;
    outputBase.value = preset.dataset.to;
    updateCustomField(inputBase, inputCustomBase);
    updateCustomField(outputBase, outputCustomBase);
    runConversion({ record: false });
    inputValue.focus();
    inputValue.select();
  });
});

copyButton.addEventListener('click', async () => {
  if (outputValue.textContent === '—') return;
  try {
    await navigator.clipboard.writeText(outputValue.textContent);
    copyButton.textContent = 'Copied';
    copyButton.classList.add('copied');
    setTimeout(() => {
      copyButton.textContent = 'Copy';
      copyButton.classList.remove('copied');
    }, 1400);
  } catch {
    statusLine.textContent = 'Copy was blocked by the browser.';
    statusLine.classList.add('error');
  }
});

document.querySelector('#clear-history').addEventListener('click', () => {
  history.length = 0;
  renderHistory();
});

updateCustomField(inputBase, inputCustomBase);
updateCustomField(outputBase, outputCustomBase);
runConversion();
