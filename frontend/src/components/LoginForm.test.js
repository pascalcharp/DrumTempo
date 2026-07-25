import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LoginForm from './LoginForm.vue';

describe('LoginForm', () => {
  it("émet 'connexion' avec email et mot de passe (mode par défaut)", async () => {

    const wrapper = mount(LoginForm) ;

    const emailInputWrapper = wrapper.find('[data-test="input-email"]') ;
    expect(emailInputWrapper.exists()).toBe(true) ;
    await emailInputWrapper.setValue("user@email.com") ;

    const passwordInputWrapper = wrapper.find('[data-test="input-mot-de-passe"]') ;
    expect(passwordInputWrapper.exists()).toBe(true) ;
    await passwordInputWrapper.setValue("0123456789") ;

    const formWrapper = wrapper.find('[data-test="form-auth"]') ;
    expect(formWrapper.exists()).toBe(true) ;
    await formWrapper.trigger('submit') ;

    const emittedSignal = wrapper.emitted('connexion') ;
    expect(emittedSignal).toHaveLength(1) ;
    expect(emittedSignal.at(0)).toEqual( [{ email: "user@email.com", password: "0123456789" }] ) ;

  });

  it("bascule vers le mode inscription et émet 'inscription' à la soumission", async () => {

    const wrapper = mount(LoginForm) ;

    const toggleButtonWrapper = wrapper.find('[data-test="btn-toggle-mode"]') ;
    expect(toggleButtonWrapper.exists()).toBe(true) ;
    await toggleButtonWrapper.trigger('click') ;

    const emailInputWrapper = wrapper.find('[data-test="input-email"]') ;
    expect(emailInputWrapper.exists()).toBe(true) ;
    await emailInputWrapper.setValue("user@email.com") ;

    const passwordInputWrapper = wrapper.find('[data-test="input-mot-de-passe"]') ;
    expect(passwordInputWrapper.exists()).toBe(true) ;
    await passwordInputWrapper.setValue("0123456789") ;

    const formWrapper = wrapper.find('[data-test="form-auth"]') ;
    expect(formWrapper.exists()).toBe(true) ;
    await formWrapper.trigger('submit') ;

    const emittedSignal = wrapper.emitted('inscription') ;
    expect(emittedSignal).toHaveLength(1) ;
    expect(emittedSignal.at(0)).toEqual( [{ email: "user@email.com", password: "0123456789" }] ) ;

  });

  it("deux clics consécutifs ramènent le mode à connexion et émet 'connexion' à la soumission", async () => {

    const wrapper = mount(LoginForm) ;

    const toggleButtonWrapper = wrapper.find('[data-test="btn-toggle-mode"]') ;
    expect(toggleButtonWrapper.exists()).toBe(true) ;

    await toggleButtonWrapper.trigger('click') ;
    await toggleButtonWrapper.trigger('click') ;

    const emailInputWrapper = wrapper.find('[data-test="input-email"]') ;
    expect(emailInputWrapper.exists()).toBe(true) ;
    await emailInputWrapper.setValue("user@email.com") ;

    const passwordInputWrapper = wrapper.find('[data-test="input-mot-de-passe"]') ;
    expect(passwordInputWrapper.exists()).toBe(true) ;
    await passwordInputWrapper.setValue("0123456789") ;

    const formWrapper = wrapper.find('[data-test="form-auth"]') ;
    expect(formWrapper.exists()).toBe(true) ;
    await formWrapper.trigger('submit') ;

    const emittedSignal = wrapper.emitted('connexion') ;
    expect(emittedSignal).toHaveLength(1) ;
    expect(emittedSignal.at(0)).toEqual( [{ email: "user@email.com", password: "0123456789" }] ) ;

  });

  it("affiche le message d'erreur reçu en prop", () => {

    const wrapper = mount(LoginForm, { props: {erreur: 'Identifiants invalides' } }) ;
    const errorBannerWrapper = wrapper.find('[data-test="msg-erreur-auth"]') ;
    expect(errorBannerWrapper.exists()).toBe(true) ;
    expect(errorBannerWrapper.text()).toBe('Identifiants invalides') ;

  });
});
