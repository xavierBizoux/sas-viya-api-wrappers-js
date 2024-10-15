proc print data=&librarySelect..&tableSelect ;
    where &columnSelect="&valueSelect" ;
run;
