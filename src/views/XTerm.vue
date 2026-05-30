<template>
    <div ref="terminal" style="width: 100%; height: 100%;"></div>
  </template>
  
  <script>
    import { Terminal } from "xterm";
    import "xterm/css/xterm.css";
    import { t } from "../i18n";
    
    export default {
        name: "Terminal",
        mounted() {
            this.term = new Terminal();
            this.term.open(this.$refs.terminal);
        
            // Simuler une commande
            this.term.writeln(t('terminal.xtermWelcome'));
            this.term.writeln("$");
        },
        destroyed() {
            this.term.dispose();
        },
    };
  </script>
  
  <style>
  </style>
