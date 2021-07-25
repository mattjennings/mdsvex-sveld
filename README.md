# mdsvex-sveld

Generate documentation for your Svelte components using [sveld](https://github.com/IBM/sveld)

## Setup

```
npm install mdsvex-sveld
```

In your mdsvex config:

```js
import sveld from "mdsvex-sveld";

const config = {
  remarkPlugins: [sveld],
  ...
};
```

## Usage

You can add generated tables that describe the components props, slots, events, etc. with the following syntax:

````md
```docs
./Button.svelte
```
````

Let's say this was Button.svelte:

```svelte
<script>
	/**
	 * The button type
	 *
	 * @type {"button" | "submit" | "reset"} */
	export let type = 'button'

	/**
	 * Set to `true` to use the primary variant
	 */
	export let primary = false
</script>

<button {...$$restProps} {type} class:primary on:click>
	<slot name="icon" />
	<slot>Click me</slot>
</button>
```

This would be the generated markdown:

```md
### Props

| Prop    | Type                                                 | Default               | Description                              |
| :------ | :--------------------------------------------------- | --------------------- | ---------------------------------------- |
| type    | <code>"button" &#124; "submit" &#124; "reset"</code> | <code>'button'</code> | The button type                          |
| primary | <code>boolean</code>                                 | <code>false</code>    | Set to `true` to use the primary variant |

### Slots

| Name | Default | Props | Fallback              |
| :--- | :------ | :---- | :-------------------- |
|      | Yes     |       | <code>Click me</code> |
| icon | No      |       |                       |

### Events

| Name  | Type      | Detail |
| :---- | :-------- | :----- |
| click | forwarded |        |
```

### Options

If you don't want all tables at once, you can specify a specific table:

````md
```docs:props
./Button.svelte
```
````

```md
| Prop    | Type                                                 | Default               | Description                              |
| :------ | :--------------------------------------------------- | --------------------- | ---------------------------------------- |
| type    | <code>"button" &#124; "submit" &#124; "reset"</code> | <code>'button'</code> | The button type                          |
| primary | <code>boolean</code>                                 | <code>false</code>    | Set to `true` to use the primary variant |
```
