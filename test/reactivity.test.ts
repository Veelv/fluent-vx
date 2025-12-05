import { ReactiveObject, reactive, computed, watch, Effect } from '../src/runtime/reactivity';

describe('Reactivity System', () => {
  it('should create reactive objects', () => {
    const obj = { count: 0 };
    const reactiveObj = reactive(obj);

    expect(reactiveObj.count).toBe(0);
    expect(reactiveObj).not.toBe(obj); // Should be a proxy
  });

  it('should track property changes', () => {
    const obj = { count: 0 };
    const reactiveObj = reactive(obj);

    let changed = false;
    const effect = new Effect(() => {
      changed = true;
    });

    // Simulate tracking
    reactiveObj.count = 1;
    expect(obj.count).toBe(1);
  });

  it('should create computed properties', () => {
    const obj = reactive({ a: 1, b: 2 });
    const sum = computed(() => obj.a + obj.b);

    expect(sum.value).toBe(3);

    obj.a = 2;
    expect(sum.value).toBe(4);
  });

  it('should watch for changes', () => {
    const obj = reactive({ count: 0 });
    let newValue: number | undefined;
    let oldValue: number | undefined;

    const unwatch = watch(
      () => obj.count,
      (n, o) => {
        newValue = n;
        oldValue = o;
      }
    );

    obj.count = 1;
    expect(newValue).toBe(1);
    expect(oldValue).toBe(0);

    unwatch();
  });

  it('should handle nested reactivity', () => {
    const obj = reactive({
      user: {
        name: 'John',
        profile: {
          age: 25
        }
      }
    });

    expect(obj.user.name).toBe('John');
    expect(obj.user.profile.age).toBe(25);

    obj.user.name = 'Jane';
    expect(obj.user.name).toBe('Jane');
  });
});