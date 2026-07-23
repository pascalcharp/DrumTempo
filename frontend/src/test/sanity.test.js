import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('Infrastructure de test (Vitest + @vue/test-utils)', () => {
  it('monte un composant et lit son contenu rendu', () => {
    const wrapper = mount({
      template: '<p>{{ message }}</p>',
      data: () => ({ message: 'ok' }),
    });

    expect(wrapper.text()).toBe('ok');
  });
});
