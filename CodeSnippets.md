# nearest N results #

```
    name = params[:name]
    latitude = params[:hublat]
    longitude = params[:hublng]
    types = { "R" => "Restaurant", "B" => "Bar", "S" => "Store" }
    spottypes = params[:spottype].map do |t|
      types[t]
    end
    nearesthowmany = params[:nearesthowmany]
    # thank you, Pythagoras
    orderthing = '((latitude - '+latitude+') * (latitude - '+latitude+') + (longitude - '+longitude+') * (longitude - '+longitude+'))'
    @property = Property.find(:all, :conditions => [ "spottype IN (?) AND name like %?%", spottypes, name], :order => orderthing, :limit => nearesthowmany)
```

