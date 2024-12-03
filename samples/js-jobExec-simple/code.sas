%macro generateOutput;
    ods html file=_webout ;

    proc print data=sashelp.class;
        %IF "&type"="CHAR" %then %do;
            where &column="&value";
        %end;
        %Else %do;
            where &column=&value;
        %end;
    run;
    ods html close;
%mend;

%JESBEGIN;
%generateOutput;
%JESEND;
