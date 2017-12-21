# system requirement
```
    node version > 9.0 
```
# package installation
```
    npm install
```

# Comand to start service
```
    NODE_ENV=<environment> node bin/run  
```

Possible value for environemt is localhost, staging, production

Optional Arguments that can be passed is: 
```
    --lcid <name>
    --stickerId <name>
    --lsid <name>
    --limit <number>
```

Expample: NODE_ENV=contentqa node bin/run --lcid danceanim --limit 5
