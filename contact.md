---
layout: page
title: Contact
description: Let's talk.
permalink: /contact/
---

<style type="text/css" media="screen">
  .container {
    margin: 0px auto;
    max-width: 600px;
  }
</style>

<div class="container">

  <h2>Talk to us</h2>

  <div id="form" class="contact-form">
    <form accept-charset="UTF-8" method="POST" action="https://formspree.io/{{ site.email }}" v-on:submit.prevent="validateBeforeSubmit" ref="contact">
      <fieldset>
        <input type="hidden" name="_subject" value="New contact!" />
        <input type="hidden" name="_next" value="{{ site.url }}/contact/message-sent/" />
        <input type="hidden" name="_language" value="en" />

        <input type="text" name="name" placeholder="Your name" v-validate="'required'" 
          v-bind:class="{ 'has-error': errors.has('name') }">
        <span v-if="errors.has('name')" v-cloak>${ errors.first('name') }</span>

        <input type="text" name="email" placeholder="Your e-mail" v-validate="'required|email'" 
          v-bind:class="{ 'has-error': errors.has('email') }">
        <span v-if="errors.has('email')" v-cloak>${ errors.first('email') }</span>

        <textarea name="message" onkeyup="adjust_textarea(this)" placeholder="Your message" v-validate="'required'" 
          v-bind:class="{ 'has-error': errors.has('message') }"></textarea>
        <span v-if="errors.has('message')" v-cloak>${ errors.first('message') }</span>

        <button type="submit">Send</button>
      </fieldset>
    </form>
  </div>

</div>

<script type="text/javascript">
  function adjust_textarea(h) {
    h.style.height = "200px";
    h.style.height = (h.scrollHeight)+"px";
  }
</script>
<script src="https://unpkg.com/vue@2.4.2"></script>
<script src="https://unpkg.com/vee-validate@2.0.0-rc.8"></script>
<script type="text/javascript">
  Vue.use(VueValidate);

  new Vue({
    el: '#form',
    delimiters: ['${', '}'],
    methods: {
      validateBeforeSubmit: function () {
        this.$validator.validateAll();
        if (!this.errors.any()) {
          this.$refs.contact.submit();
        }
      }
    }
  });
</script>
