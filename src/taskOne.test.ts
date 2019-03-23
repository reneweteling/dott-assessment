// Taks 1, took about 2 min for the test, then 1 for the method TDD :)

const addN = (base: number) => (n: number) => base + n;

test('addN', () => {
  const addHeight = addN(8);

  expect(addHeight(7)).toEqual(15);
  expect(addHeight(100)).toEqual(108);
});
