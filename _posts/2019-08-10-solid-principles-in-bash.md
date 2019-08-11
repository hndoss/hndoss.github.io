---
layout: post
title: "SOLID Principles in Bash?"
description: .
image: 'https://cdn.pixabay.com/photo/2018/01/21/15/18/wall-3096829_960_720.jpg'
twitter_text: is it possible to do SOLID in bash?
category: 'blog'
introduction: Blah blah blah
---

Anyone can bring a solution to a problem. When we build software, we are doing just that: bringing solutions to known problems and challenges. But doing it well is a whole different story. Effort is not necessarily all what is needed to have it done, but combining it with our heart and will. When you look back to the things you have done, **do you feel satisfied?**

They are many other stuffs in software industry that are really important in terms of quality code. Talking about principles, which are the foundation of what we are and the explanation of what we do, like when you decide to say choice good .....

# SOLID Principles
SOLID principles are not something new, in fact, it is a well-known concept introduced by ["Uncle Bob" Martin](). He also contributed to the [Agile Manifesto](https://agilemanifesto.org/) and is the author of [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship-ebook-dp-B001GSTOAM/dp/B001GSTOAM/ref=mt_kindle?_encoding=UTF8&me=&qid=).

In a nutshell:
> SOLID is a mnemonic acronym for five design principles intended to make software designs more understandable, flexible and maintainable.

## Why Bash?

SOLID principles are meant for object-oriented programming. Bash is a Unix shell and command language written by Brian Fox for the GNU Project as a free software replacement for the Bourne shell. Join these two statements and it seems like SOLID principles and Bash Scripts are from different universe. 

But what is it in fact a principle? It is an accepted or professed rule of action or conduct. Bash scripts can be hard to read sometimes and gets messy really quick. They are hard to maintain, ergo they rot first. If you sweep your room with dedication, wouldn't you do the same in the bathroom where it is known that it will get dirty? Be SOLID, at least in its essence. 


## Do it in bash

Write a bash script that copies all files by extension recursively from a directory, and create an index file for reference.

### S: Single Responsibility

> A class should have only one reason to change.

This one is easy to explain, although Bash does not support classes. It is quite easy to tell when a script is trying to do many things at once. Consider the following example:
```
#!/bin/bash

find . -name "*.txt" \
    -exec mkdir -p output/"$(readlink -f {})" \; \
    -exec cp {} output/"$(readlink -f {})" \; \
    -exec echo "$(readlink -f {})" >> index.txt \;

pacman -Syu
source many_complex_instructions.sh
source hack_the_pentagon.sh
```
This chunk of code is clearly being too greedy. We might want to have it simple at the beginning. It is also a little bit obscure and might be hard to read and get what is this script actually doing.
```
#!/bin/bash

find . -name "*.txt" \
    -exec mkdir -p "output$(readlink -f {})" \; \
    -exec cp {} "output$(readlink -f {})" \; \
    -exec echo "$(readlink -f {})" >> index.txt \;
```

---
### O: Open/Closed

> Software entities should be open for extension, but closed for modification.

Our script doesn't look good. `find` is just searching in the current directory. That is what `find .` does. Also, every time someone wants a different directory rather than `/tmp`, it will be necessary to manually update the script over and over. And what if tomorrow I want to also search for *.txt files? Let's try to improve the script a little bit. 

```
#!/bin/bash

target_directory="${1}" # saves the first input in a variable.
target_format="${2}"    # saves the second input in a variable.
output_directory="${3}" # saves the third input in a variable.

find ${target_directory} -name "*.${target_format}" \
   -exec mkdir -p "${output_directory}/output$(readlink -f {})" \; \
   -exec cp {} "${output_directory}/output$(readlink -f {})" \; \
   -exec echo {} >> "${output_directory}"/index.txt \;
```

How to use it? With this line of code the script would search in `/media/backup` for all the `zip` files, put a copy in `/media/my_usb` and create a `/media/my_usb/index.txt` with all the results. If you change your mind, now is just necessary to change the arguments. This means our script can allow its behaviour to be extended without modifying its source code, because it won't be necessary if it is used somewhere else, also in other scripts.
```
chmod +x script.sh
mv script.sh /usr/local/bin/cp2
cp2 /media/backup zip /media/my_usb 
```

### L: Liskov Substitution
> Functions that use pointers of references to base classes must be able to use objects of derived classes without knowing it.

This one is hard to see out of the context of [OOP](https://en.wikipedia.org/wiki/Object-oriented_programming) since we don't have inheritance or polymorphism in Bash. But, why is Liskov Substitution so great? This principle is trying to ensure that our code is extendible enough by checking if our code behaves differently . So, we want our script to be as general as possible and work in all the cases our defined scope can handle.

What would happen if you want to search for TXT instead of txt? Let's make this script to 

```
#!/bin/bash

target_directory="${1}" # saves the first input in a variable.
target_format="${2}"    # saves the second input in a variable.
output_directory="${3}" # saves the third input in a variable.

find ${target_directory} -name "*.${target_format}" \
   -exec mkdir -p "${output_directory}/output$(readlink -f {})" \; \
   -exec cp {} "${output_directory}/output$(readlink -f {})" \; \
   -exec echo {} >> "${output_directory}"/index.txt \;
```
### I: Interface Segregation
```
#!/bin/bash
find $1 -iname *.jpeg \
    -exec cp {} /tmp && \
    echo {} >> /tmp/index.txt \;
```
### D: Dependency Inversion
```
#!/bin/bash

target_directory="${1}" # saves the first input in a variable.
target_format="${2}"    # saves the second input in a variable.
output_directory="${3}" # saves the third input in a variable.

function create_output_directory(){
    file="${1}"
    file_absolute_path="$(readlink -f ${file})"

    mkdir -p "${output_directory}/output/${file_absolute_path//.\/}"
}

# function copy_files(){

# }

# function add_file_to_index(){

# }

function main(){

}

main "${@}"
# find ${target_directory} -name "*.${target_format}" \
#    -exec create_output_directory {} \; \
#     \; \
#    -exec cp {} "${output_directory}/output$(readlink -f {})" \; \
#    -exec echo {} >> "${output_directory}"/index.txt \;
```

## Conclusion
