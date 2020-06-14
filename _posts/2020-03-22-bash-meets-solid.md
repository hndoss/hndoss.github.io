---
layout: post
title: "Bash Meets SOLID"
description: .
image: 'https://cdn.pixabay.com/photo/2018/01/21/15/18/wall-3096829_960_720.jpg'
twitter_text: Anyone can bring a solution to a problem. But doing it well is a whole different story.
category: 'code'
introduction: Anyone can bring a solution to a problem. But doing it well is a whole different story.
---

Anyone can bring a solution to a problem, but doing it well is a whole different story. Effort is not necessarily all that is needed to have it done: combining it with our hearts and wills is also necessary. So how do we know if we are doing something well enough? Well, following principles is a good rule of thumb. The question is: does this rule of thumb apply to bash scripts as well?

# Bash Meets SOLID
SOLID principles are not something new, in fact, it is a well-known concept introduced by ["Uncle Bob" Martin](https://en.wikipedia.org/wiki/Robert_C._Martin), contributor to the [Agile Manifesto](https://agilemanifesto.org/) and author of [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship-ebook-dp-B001GSTOAM/dp/B001GSTOAM/ref=mt_kindle?_encoding=UTF8&me=&qid=).

In a nutshell:
> SOLID is a mnemonic acronym for five design principles intended to make software designs more understandable, flexible and maintainable.

## Why Bash?

SOLID principles are meant for object-oriented programming. In contrast, Bash is a Unix shell and a command language written by Brian Fox for the GNU Project as a free software replacement for the Bourne shell. Join these two statements and it seems like SOLID principles and Bash scripts are from different universes.

But a principle is in fact an accepted or professed rule of action or conduct. Bash scripts can be hard to read sometimes and tend to get messy really quickly. They are hard to maintain, ergo they rot first. However, if you sweep your room with dedication, wouldn't you do the same in the bathroom where you know things get dirty? If you can dedicate yourself to right maintanable code, so can you also be SOLID with Bash scripts, at least in the essence of its principles.

As an example, I wrote a Bash script that copies all files recursively from a directory by extension and saves all the filenames in an index file for reference. There are many ways to make this work and let's say Bash scripts are not necessarily a high performance solution, so take this example only for didactic purposes.

### S: Single Responsibility

> A class should have only one reason to change

This one isn't hard to explain, although Bash does not support classes. It is quite easy to tell when a script is trying to do many things at once. Consider the following example:

```bash
#!/bin/bash

find /tmp -name "*.txt" \
    -exec mkdir -p output/"$(readlink -f {})" \; \
    -exec cp {} output/"$(dirname -- {})" \; \
    -exec echo {} >> index.txt \;

pacman -Syu
source many_complex_instructions.sh
source hack_the_pentagon.sh
```

This chunk of code is clearly being too greedy. We might want to have it simple at the beginning. It is also a little bit obscure so it might be hard to read, and it probably is not doing exactly what it is supposed to do.

---
### O: Open/Closed

> Software entities should be open for extension, but closed for modification

Our script doesn't look good. `find` is just searching in `/tmp` directory. Notice that every time someone wants a different directory rather than `/tmp`, it will be necessary to manually update the script over and over. And what if tomorrow I want to also search for `.jpeg` files? Let's try to improve the script a little bit:

```bash
#!/bin/bash

target_directory="${1}" # saves the first input in a variable.
target_format="${2}"    # saves the second input in a variable.
output_directory="${3}" # saves the third input in a variable.

find ${target_directory} -name "*.${target_format}" \
   -exec mkdir -p "${output_directory}/output$(readlink -f {})" \; \
   -exec cp {} "${output_directory}/output$(readlink -f {})" \; \
   -exec echo {} >> "${output_directory}"/index.txt \;
```

If you change your mind about what file formats to copy, now you just modify the arguments. This means our script can allow its behavior to be extended without modifying its source code.

---
### L: Liskov Substitution
> Functions that use pointers of references to base classes must be able to use objects of derived classes without knowing it

This one is hard to see out of the context of [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) since Bash don't support inheritance or polymorphism, but that doesn't mean that we can't apply its essence to them. So, why is Liskov Substitution so great? This principle tries to ensure that our code is extensible enough by checking if it behaves the same regardless of the entities with which it works. What would happen if you want to search for `.TXT` instead of `.txt`? It doesn't matter which extension the script receives as an entry, it behaves exactly the same way. A violation to this principle would be that the script behaves differently if we input `.sh` as the desired filter; and suddenly our script tried to execute the files instead of just copying them.

To follow this principle, we change the `-name` flag to `-iname` so that the search is case insensitive.

```bash
#!/bin/bash

target_directory="${1}" # saves the first input in a variable.
target_format="${2}"    # saves the second input in a variable.
output_directory="${3}" # saves the third input in a variable.

# changed -name to -iname
find ${target_directory} -iname "*.${target_format}" \
   -exec mkdir -p "${output_directory}/output$(readlink -f {})" \; \
   -exec cp {} "${output_directory}/output$(readlink -f {})" \; \
   -exec echo {} >> "${output_directory}"/index.txt \;
```

---

### I: Interface Segregation

> No client should be forced to depend on methods it does not use

This one is hard to break in Bash. Doing away with unnecessary imports using the `source` directive can do the trick.
 
---

### D: Dependency Inversion
> High-level modules should not depend on low-level modules. Both should depend on abstractions. Abstractions should not depend on details. Details should depend on abstractions

Sometimes it's really hard to tell what is going on with some scripts. It is possible to reduce thire complexity by delegating processes to functions with descriptive names. That way if some function isn't working properly, it is easier to spot the piece of code that needs improvement. In this case, again, Bash doesn't support classes or objects, therefore it is not possible to talk about hierarchy. Furthermore, functions are quite coupled in such a way that it is difficult to reuse logic in other places. I would say that this is the most difficult principle to try to reproduce in Bash.

```bash
#!/bin/bash

target_directory="${1}" # saves the first input in a variable.
target_format="${2}"    # saves the second input in a variable.
output_directory="${3}" # saves the third input in a variable.

function create_output_directory(){
   mkdir -p "${output_directory}/output/${dir_name}"
}

function copy_file(){
   cp "${file}" "${output_directory}/output/${dir_name}/"
}

function add_file_to_index(){
   ls "${file}" >> "${output_directory}"/output/index.txt
}

function main(){
   for file in `find "${target_directory}" -type f -iname "*.${target_format}"`
   do
      export file="${file}"
      export dir_name="$(dirname  -- ${file})"

      create_output_directory "${file}"
      copy_file "${file}"
      add_file_to_index "${file}"
   done
}

main "${@}"
```

## Conclusion
As expected, Bash and SOLID principles don't match perfectly, but it is possible to consider the principles behind SOLID and extract good practices in OOP from them in order to have better Bash scripts and to learn a few things.
